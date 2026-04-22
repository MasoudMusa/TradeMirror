import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      account_id,
      ticket, 
      symbol, 
      direction, 
      lot_size, 
      entry_price, 
      sl, 
      tp, 
      entry_time, 
      bias, 
      setup_type, 
      entry_model, 
      session,
      timeframe,
      screenshot,
      account_info 
    } = body;

    // Authenticate EA with MT5 Id awareness for switch detection
    const auth = await authenticateEA(request, account_id ? String(account_id) : undefined);
    if (auth.error) return auth.error;
    const userId = auth.userId;
    let account = auth.account;

    console.log('Trade create body:', JSON.stringify(body, null, 2));
    // We prioritize the authenticated account. 
    // If the account record doesn't have an mt5_account_id yet (first sync), we link it.
    const payloadAccountId = account_id || account_info?.account_id;

    if (!ticket && ticket !== 0) {
      return NextResponse.json({ error: 'Missing ticket' }, { status: 400 });
    }

    if (!account && !payloadAccountId) {
       return NextResponse.json({ error: 'Missing account context (no token or account_id)' }, { status: 400 });
    }

    // Get or create account logic (Legacy fallback)
    if (!account && payloadAccountId) {
        const { account: fetchedAccount, error: accountError } = await getOrCreateAccount(userId, payloadAccountId.toString(), body);
        if (accountError || !fetchedAccount) {
            return NextResponse.json({ error: accountError || 'Failed to get account' }, { status: 500 });
        }
        account = fetchedAccount;
    } else if (account && payloadAccountId) {
        // Link MT5 ID if not linked
        if (!account.mt5_account_id) {
             await supabaseAdmin
            .from('accounts')
            .update({ mt5_account_id: payloadAccountId.toString() })
            .eq('id', account.id);
        }
    }

    // Create or update trade
    const { data: trade, error } = await supabaseAdmin
      .from('trades')
      .upsert({
        account_id: account.id,
        // Use string to avoid BigInt JSON serialization error
        ticket: ticket.toString(),
        symbol,
        direction,
        lot_size: parseFloat(lot_size),
        entry_price: parseFloat(entry_price),
        sl: sl ? parseFloat(sl) : null,
        tp: tp ? parseFloat(tp) : null,
        status: 'ACTIVE',
        open_time: entry_time || new Date().toISOString(),
        bias,
        setup_type,
        entry_model,
        session,
        timeframe,
        current_price: parseFloat(entry_price),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'account_id,ticket',
      })
      .select()
      .single();

    if (error) {
      console.error('Trade creation error:', error);
      return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
    }

    // Create entry event
    await supabaseAdmin
      .from('trade_events')
      .insert({
        trade_id: trade.id,
        event_type: 'ENTRY',
        timestamp: entry_time || new Date().toISOString(),
        screenshot: screenshot || null,
        data: {
          account_info,
          entry_price,
          sl,
          tp
        }
      });

    return NextResponse.json({ success: true, trade });
  } catch (err) {
    console.error('Trade Create Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
