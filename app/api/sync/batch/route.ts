import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';
import { uploadBase64Image } from '@/lib/storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * High-Performance Reliable Batch Sync Endpoint
 * Processes events in bulk to avoid MQL5 WebRequest timeouts.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, events } = body;

    if (!accountId || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Missing accountId or events array' }, { status: 400 });
    }

    // Authenticate EA
    const auth = await authenticateEA(request, String(accountId));
    if (auth.error) return auth.error;
    const account = auth.account;

    console.log(`Processing batch of ${events.length} events for account ID: ${account.id} (MT5: ${accountId})`);

    if (events.length === 0) {
      return NextResponse.json({ success: true, processed_count: 0, acknowledged_ids: [] });
    }

    // 1. Bulk Idempotency Check
    const eventIds = events.map(e => String(e.event_id));
    const { data: existingEvents } = await supabaseAdmin
      .from('trade_events')
      .select('id')
      .in('id', eventIds);

    const existingIdSet = new Set(existingEvents?.map(e => e.id) || []);
    const newEvents = events.filter(e => !existingIdSet.has(String(e.event_id)));

    if (newEvents.length === 0) {
      return NextResponse.json({ success: true, processed_count: events.length, acknowledged_ids: eventIds });
    }

    // 2. Fetch all required trades in bulk
    const tickets = Array.from(new Set(newEvents.map(e => String(e.ticket))));
    const { data: existingTrades } = await supabaseAdmin
      .from('trades')
      .select('id, ticket')
      .eq('account_id', account.id)
      .in('ticket', tickets);

    const tradeMap = new Map<string, string>(); // ticket -> db_id
    existingTrades?.forEach(t => tradeMap.set(String(t.ticket), t.id));

    // 3. Identify missing trades and create them (Synthetic/Open)
    const missingTickets = tickets.filter(t => !tradeMap.has(t));
    if (missingTickets.length > 0) {
      console.log(`Creating ${missingTickets.length} missing trades in batch`);
      
      const tradesToCreate = missingTickets.map(ticketStr => {
        const firstEvent = newEvents.find(e => String(e.ticket) === ticketStr);
        return {
          account_id: account.id,
          ticket: ticketStr, // Use string, Supabase handles casting to int8
          symbol: firstEvent?.symbol || 'UNKNOWN',
          direction: firstEvent?.direction || (firstEvent?.type_str === 'BUY' ? 'BUY' : 'SELL') || 'UNKNOWN',
          status: (firstEvent && ['CLOSE', 'SL_HIT', 'TP_HIT', 'MANUAL_CLOSE', 'ENTRY'].includes(firstEvent.type) && firstEvent.type !== 'ENTRY') ? 'CLOSED' : 'ACTIVE',
          lot_size: parseFloat(firstEvent?.lot_size || firstEvent?.volume || '0'),
          entry_price: parseFloat(firstEvent?.entry_price || '0'),
          pnl: parseFloat(firstEvent?.profit ?? firstEvent?.result_pnl ?? firstEvent?.pnl ?? '0'),
          commission: parseFloat(firstEvent?.commission ?? '0'),
          swap: parseFloat(firstEvent?.swap ?? '0'),
          open_time: firstEvent?.entry_time || firstEvent?.timestamp || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      const { data: createdTrades, error: createError } = await supabaseAdmin
        .from('trades')
        .upsert(tradesToCreate, { onConflict: 'account_id,ticket' })
        .select('id, ticket');

      if (createError) throw createError;
      createdTrades?.forEach(t => tradeMap.set(String(t.ticket), t.id));
    }

    // 4. Prepare bulk updates for trades and inserts for events
    const tradeUpdatesMap = new Map<string, any>();
    const eventsToInsert: any[] = [];

    // Process events and handle screenshot uploads
    await Promise.all(newEvents.map(async (event) => {
      const tradeId = tradeMap.get(String(event.ticket));
      if (!tradeId) return;

      // Update trade state based on event type
      if (['CLOSE', 'SL_HIT', 'TP_HIT', 'MANUAL_CLOSE'].includes(event.type)) {
        tradeUpdatesMap.set(tradeId, {
          id: tradeId,
          status: 'CLOSED',
          exit_price: parseFloat(event.exit_price || event.current_price || '0'),
          close_time: event.exit_time || event.timestamp || new Date().toISOString(),
          pnl: parseFloat(event.pnl ?? event.profit ?? event.result_pnl ?? '0'),
          commission: parseFloat(event.commission ?? '0'),
          swap: parseFloat(event.swap ?? '0'),
          result_r: parseFloat(event.result_r ?? '0'),
          updated_at: new Date().toISOString()
        });
      } else if (['MODIFY_SL', 'MODIFY_TP', 'SL_MOVE', 'TP_MOVE'].includes(event.type)) {
        const current = tradeUpdatesMap.get(tradeId) || { id: tradeId };
        tradeUpdatesMap.set(tradeId, {
          ...current,
          sl: event.sl ? parseFloat(event.sl) : current.sl,
          tp: event.tp ? parseFloat(event.tp) : current.tp,
          updated_at: new Date().toISOString()
        });
      }

      // Handle Screenshot Upload in Batch
      let screenshotUrl = null;
      if (event.screenshot && event.screenshot.length > 100) {
        const typeLower = (event.type || 'unknown').toLowerCase();
        const path = `screenshots/trade_${event.ticket}/${typeLower}_${event.event_id}.gif`;
        const { url, error: uploadError } = await uploadBase64Image(event.screenshot, path);
        if (uploadError) {
          console.warn(`Batch upload failed for event ${event.event_id}:`, uploadError);
        } else {
          screenshotUrl = url;
        }
      }

      eventsToInsert.push({
        id: event.event_id,
        trade_id: tradeId,
        event_type: event.type || 'UNKNOWN',
        timestamp: event.timestamp || new Date().toISOString(),
        screenshot: screenshotUrl, // Use storage URL
        data: { ...event, screenshot: undefined } // Remove raw base64 from data blob to save space
      });
    }));

    // 5. Execute bulk operations
    const tradeUpdates = Array.from(tradeUpdatesMap.values());
    
    await Promise.all([
      tradeUpdates.length > 0 ? supabaseAdmin.from('trades').upsert(tradeUpdates) : Promise.resolve(),
      eventsToInsert.length > 0 ? supabaseAdmin.from('trade_events').insert(eventsToInsert) : Promise.resolve()
    ]);

    return NextResponse.json({ 
      success: true, 
      processed_count: events.length, 
      acknowledged_ids: eventIds 
    });

  } catch (err: any) {
    console.error('Batch Sync Error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
