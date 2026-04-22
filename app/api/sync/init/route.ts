import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      account_id, 
      broker, 
      currency, 
      leverage, 
      balance, 
      equity, 
      profit, 
      margin, 
      free_margin,
      initial_balance,
      open_positions 
    } = body;

    // Authenticate EA with MT5 Id awareness for switch detection
    const auth = await authenticateEA(request, account_id ? String(account_id) : undefined);
    if (auth.error) return auth.error;
    const userId = auth.userId;
    // Account is now returned by authenticateEA
    let account = auth.account;
    if (!account_id) {
      return NextResponse.json({ error: 'Missing account_id' }, { status: 400 });
    }

    // Get or create account using legacy flow logic if not present on auth object
    if (!account) {
       const { account: fetchedAccount, error: accountError } = await getOrCreateAccount(userId, account_id.toString(), body);
       if (accountError || !fetchedAccount) {
         return NextResponse.json({ error: accountError || 'Failed to get account' }, { status: 500 });
       }
       account = fetchedAccount;
    } else {
        // Update account metrics for the authenticated account
        await supabaseAdmin
            .from('accounts')
            .update({
                mt5_account_id: account_id.toString(), // Ensure this is linked
                name: body.account_name || account.name, // Update name if provided
                broker,
                currency,
                leverage: parseInt(leverage),
                balance: parseFloat(balance),
                equity: parseFloat(equity),
                profit: parseFloat(profit),
                margin: parseFloat(margin),
                free_margin: parseFloat(free_margin),
                initial_balance: initial_balance ? parseFloat(initial_balance) : (account.initial_balance || 0),
                last_sync_at: new Date().toISOString(),
                last_heartbeat_at: new Date().toISOString(), // Use init as first heartbeat
                is_active: true
            })
            .eq('id', account.id);
            
         // Refresh account object
         account.id = account.id; // Just to be safe, though ID shouldn't change
    }

    // Check if we should suggest a historical re-sync (if DB is empty but EA reports being linked)
    let shouldReSync = false;
    const { count } = await supabaseAdmin
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);

    if (count === 0) {
      shouldReSync = true;
      console.log(`Account ${account.id} has 0 trades, signaling re-sync`);
    }

    // Initial sync for open positions
    if (open_positions && Array.isArray(open_positions)) {
      // Deduplicate positions based on ticket
      const uniquePositions = new Map();
      open_positions.forEach(pos => {
         uniquePositions.set(pos.ticket.toString(), pos);
      });
      
      const distinctPositions = Array.from(uniquePositions.values());

      for (const pos of distinctPositions) {
        await supabaseAdmin
          .from('trades')
          .upsert({
            account_id: account.id,
            // Use string to avoid BigInt issues
            ticket: pos.ticket.toString(),
            symbol: pos.symbol,
            direction: pos.direction,
            lot_size: parseFloat(pos.volume),
            entry_price: parseFloat(pos.entry_price),
            sl: pos.sl ? parseFloat(pos.sl) : null,
            tp: pos.tp ? parseFloat(pos.tp) : null,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'account_id,ticket',
          });
      }
    }

    return NextResponse.json({ 
      success: true, 
      account_id: account.id,
      should_re_sync: shouldReSync
    });
  } catch (err) {
    console.error('Sync Init Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
