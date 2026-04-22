import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  const auth = await authenticateEA(request);
  if (auth.error) return auth.error;
  const userId = auth.userId;

  try {
    const body = await request.json();
    const { account_id, trades } = body;

    if (!account_id || !Array.isArray(trades)) {
      return NextResponse.json({ error: 'Missing account_id or trades array' }, { status: 400 });
    }

    const { account, error: accountError } = await getOrCreateAccount(userId, account_id.toString());
    if (accountError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const upserts = trades.map(t => ({
      account_id: account.id,
      ticket: BigInt(t.ticket),
      symbol: t.symbol,
      direction: t.direction,
      lot_size: parseFloat(t.volume),
      entry_price: parseFloat(t.entry_price),
      exit_price: parseFloat(t.exit_price),
      sl: t.sl ? parseFloat(t.sl) : null,
      tp: t.tp ? parseFloat(t.tp) : null,
      pnl: parseFloat(t.result_pnl),
      open_time: t.entry_time,
      close_time: t.exit_time,
      status: 'CLOSED',
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabaseAdmin
      .from('trades')
      .upsert(upserts, { onConflict: 'account_id,ticket' });

    if (error) {
       return NextResponse.json({ error: 'Failed to sync history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: trades.length });
  } catch (err) {
    console.error('Sync History Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
