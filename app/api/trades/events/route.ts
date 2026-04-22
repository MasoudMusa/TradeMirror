import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  // Authenticate EA
  const auth = await authenticateEA(request);
  if (auth.error) return auth.error;
  const userId = auth.userId;

  try {
    const body = await request.json();
    const { 
      ea_id, 
      trade_id, 
      ticket, 
      event_type, 
      sl, 
      tp, 
      timestamp, 
      current_price,
      mfe,
      mae,
      profit,
      commission,
      swap,
      result_r,
      exit_time,
      screenshot,
      account_info,
      ...additionalData 
    } = body;

    if (!ticket) {
      return NextResponse.json(
        { error: 'Missing ticket' },
        { status: 400 }
      );
    }

    // 1. Get the account (using account_id from account_info if present, or we might need it in the root payload)
    // The EA sends account_id in account_info.balance etc, but usually we need it to identify the account.
    // Let's assume mt5_account_id is part of account_info or we extract it.
    // Looking at TM_JSON.mqh: BuildSyncInit sends account_id. BuildTradeEvent sends account_info object.
    
    // In our DB, we need to find the Trade record first to link the event.
    // To find the trade, we need (account_id, ticket).
    
    // Let's get the mt5_account_id. In MT5 it's the account LOGIN.
    const mt5_account_id = account_info?.account_id?.toString() || body.account_id?.toString();
    
    if (!mt5_account_id) {
      return NextResponse.json(
        { error: 'Missing account_id/mt5_account_id' },
        { status: 400 }
      );
    }

    const { account, error: accountError } = await getOrCreateAccount(userId, mt5_account_id);
    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // 2. Find the Trade record
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades')
      .select('id')
      .eq('account_id', account.id)
      .eq('ticket', BigInt(ticket))
      .single();

    if (tradeError || !trade) {
       console.error('Trade not found for event:', { mt5_account_id, ticket, tradeError });
       // We might want to create the trade here if it doesn't exist? 
       // For now, let's just error since it should be created via /api/trades
       return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // 3. Store the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('trade_events')
      .insert({
        trade_id: trade.id,
        event_type,
        timestamp: timestamp || new Date().toISOString(),
        screenshot: screenshot || null,
        data: {
          sl,
          tp,
          current_price,
          mfe,
          mae,
          profit,
          commission,
          swap,
          result_r,
          exit_time,
          account_info,
          ...additionalData
        }
      })
      .select()
      .single();

    if (eventError) {
      console.error('Event creation error:', eventError);
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }

    // 4. Update the trade status if it's a close event
    if (['SL_HIT', 'TP_HIT', 'MANUAL_CLOSE'].includes(event_type)) {
        await supabaseAdmin
            .from('trades')
            .update({
                status: 'CLOSED',
                exit_price: current_price,
                close_time: exit_time || new Date().toISOString(),
                pnl: profit,
                commission,
                swap,
                result_r,
                updated_at: new Date().toISOString()
            })
            .eq('id', trade.id);
    }

    return NextResponse.json({ success: true, event });
  } catch (err) {
    console.error('Event API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
