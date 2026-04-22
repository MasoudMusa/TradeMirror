import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  const auth = await authenticateEA(request);
  if (auth.error) return auth.error;
  // auth.account is now populated by validateAccessToken querying the accounts table by token
  const account = auth.account;
  if (!account) return NextResponse.json({ error: 'Account context missing' }, { status: 500 });

  try {
    const body = await request.json();
    const { account_info, open_positions } = body;
    // We prioritize the authenticated account. 
    // If the account record doesn't have an mt5_account_id yet (first sync), we link it.
    const payloadAccountId = account_info?.account_id || body.account_id;

    if (payloadAccountId && !account.mt5_account_id) {
        // Link the account
        await supabaseAdmin
            .from('accounts')
            .update({ mt5_account_id: payloadAccountId.toString() })
            .eq('id', account.id);
    } else if (payloadAccountId && account.mt5_account_id && account.mt5_account_id !== payloadAccountId.toString()) {
        console.warn(`Account ID mismatch: Token belongs to ${account.mt5_account_id}, but payload says ${payloadAccountId}`);
        // We generally trust the token, but this might indicate a config error on user side (wrong token for wrong terminal)
        // We proceed using the token's account.
    }

    // Update account metrics from account_info
    if (account_info) {
        await supabaseAdmin
          .from('accounts')
          .update({
            balance: parseFloat(account_info.balance),
            equity: parseFloat(account_info.equity),
            profit: parseFloat(account_info.profit),
            margin: parseFloat(account_info.margin),
            free_margin: parseFloat(account_info.free_margin),
            last_heartbeat_at: new Date().toISOString(),
          })
          .eq('id', account.id);
    }

    // Update or Create open trades from heartbeat
    if (open_positions && Array.isArray(open_positions)) {
        for (const pos of open_positions) {
            // Check if we have enough data to "create" the trade if missing.
            // BuildHeartbeat currently only sends ticket and profit.
            const hasFullData = pos.symbol && pos.volume && pos.price;
            const ticketString = pos.ticket?.toString();
            
            if (!ticketString) continue;

            if (hasFullData) {
              const direction = pos.type === 1 ? 'SELL' : 'BUY';
              await supabaseAdmin
                .from('trades')
                .upsert({
                  account_id: account.id,
                  ticket: ticketString,
                  symbol: pos.symbol,
                  direction: direction,
                  lot_size: parseFloat(pos.volume),
                  entry_price: parseFloat(pos.price),
                  current_price: parseFloat(pos.price),
                  floating_pnl: parseFloat(pos.profit || 0),
                  status: 'ACTIVE',
                  updated_at: new Date().toISOString(),
                  open_time: new Date().toISOString(), 
                }, {
                  onConflict: 'account_id,ticket'
                });
            } else {
              // Minimal data - only update existing trade
              await supabaseAdmin
                .from('trades')
                .update({
                  floating_pnl: parseFloat(pos.profit || 0),
                  updated_at: new Date().toISOString(),
                })
                .eq('account_id', account.id)
                .eq('ticket', ticketString);
            }
        }
    }

    // Fetch commands for this user (simple placeholder for now)
    const commands: any[] = []; 

    // Reconciliation: Get all currently ACTIVE tickets for this account from DB
    const { data: dbActiveTrades } = await supabaseAdmin
      .from('trades')
      .select('ticket')
      .eq('account_id', account.id)
      .eq('status', 'ACTIVE');

    const activeTickets = dbActiveTrades?.map(t => t.ticket.toString()) || [];

    // Check if we need a full sync (e.g. name is missing/default, or never synced)
    let shouldFullSync = false;
    if (!account.last_sync_at || !account.name || account.name === 'Pending Sync...') {
        shouldFullSync = true;
    }

    return NextResponse.json({ 
       success: true, 
       commands,
       active_tickets: activeTickets,
       should_full_sync: shouldFullSync
    });
  } catch (err) {
    console.error('Heartbeat Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
