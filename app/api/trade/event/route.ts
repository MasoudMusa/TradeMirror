import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';
import { uploadBase64Image } from '@/lib/storage';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      account_id,
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

    // Authenticate EA with MT5 Id awareness for switch detection
    const auth = await authenticateEA(request, account_id ? String(account_id) : undefined);
    if (auth.error) return auth.error;
    const userId = auth.userId;
    const account = auth.account;

    if (!account) return NextResponse.json({ error: 'Account context missing' }, { status: 500 });
    const payloadAccountId = account_id || account_info?.account_id;

    if (!ticket) {
      return NextResponse.json({ error: 'Missing ticket' }, { status: 400 });
    }

    // Link account if needed (first sync might happen via trade event theoretically, though unlikely before heartbeat/init)
    if (payloadAccountId && !account.mt5_account_id) {
        await supabaseAdmin
            .from('accounts')
            .update({ mt5_account_id: payloadAccountId.toString() })
            .eq('id', account.id);
    }

    // Find the Trade record
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades')
      .select('id')
      .eq('account_id', account.id)
      .eq('ticket', ticket.toString()) // Use current ticket (casted to string)
      .single();

    if (tradeError || !trade) {
       return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Handle Screenshot Upload if present
    let screenshotUrl = null;
    if (screenshot && screenshot.length > 100) { // Basic check for base64 data
      const path = `screenshots/trade_${ticket}/${event_type.toLowerCase()}_${Date.now()}.gif`;
      const { url, error: uploadError } = await uploadBase64Image(screenshot, path);
      if (uploadError) {
        console.warn('Screenshot upload failed, proceeding without image:', uploadError);
      } else {
        screenshotUrl = url;
      }
    }

    // Store the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('trade_events')
      .insert({
        trade_id: trade.id,
        event_type,
        timestamp: timestamp || new Date().toISOString(),
        screenshot: screenshotUrl, // Use the public storage URL
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
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }

    // Update the trade status if it's a close event
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
    console.error('Trade Event Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
