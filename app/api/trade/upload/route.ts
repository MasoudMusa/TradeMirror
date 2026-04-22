import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadBufferImage } from '@/lib/storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tradeId = formData.get('tradeId') as string;

    if (!file || !tradeId) {
      return NextResponse.json({ error: 'Missing file or tradeId' }, { status: 400 });
    }

    // 1. Verify Trade exists
    const { data: trade, error: tradeError } = await supabaseAdmin
      .from('trades')
      .select('ticket')
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // 2. Upload to Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `screenshots/trade_${trade.ticket}/manual_${Date.now()}_${file.name}`;
    
    const { url, error: uploadError } = await uploadBufferImage(
      buffer, 
      path, 
      file.type
    );

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed', details: uploadError }, { status: 500 });
    }

    // 3. Create MANUAL_ATTACHMENT event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('trade_events')
      .insert({
        trade_id: tradeId,
        event_type: 'MANUAL_ATTACHMENT',
        timestamp: new Date().toISOString(),
        screenshot: url,
        data: {
          original_name: file.name,
          manual: true
        }
      })
      .select()
      .single();

    if (eventError) {
      return NextResponse.json({ error: 'Failed to log event', details: eventError }, { status: 500 });
    }

    return NextResponse.json({ success: true, event });
  } catch (err: any) {
    console.error('Manual Upload Error:', err);
    return NextResponse.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
