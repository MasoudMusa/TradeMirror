import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account_id, ticket, symbol, direction, lot_size, entry_price, sl, tp, open_time, status } = body;

    // Authenticate EA with MT5 Id awareness for switch detection
    const auth = await authenticateEA(request, account_id ? String(account_id) : undefined);
    if (auth.error) return auth.error;
    const userId = auth.userId;

    if (!account_id || !ticket) {
      return NextResponse.json(
        { error: 'Missing required fields: account_id, ticket' },
        { status: 400 }
      );
    }

    // Get or create account
    const { account, error: accountError } = await getOrCreateAccount(userId, account_id, body);
    if (accountError || !account) {
      return NextResponse.json(
        { error: accountError || 'Failed to get account' },
        { status: 500 }
      );
    }

    // Create or update trade
    const { data: trade, error } = await supabaseAdmin
      .from('trades')
      .upsert({
        account_id: account.id,
        ticket: BigInt(ticket),
        symbol,
        direction,
        lot_size: parseFloat(lot_size),
        entry_price: parseFloat(entry_price),
        sl: sl ? parseFloat(sl) : null,
        tp: tp ? parseFloat(tp) : null,
        status: status || 'ACTIVE',
        open_time: open_time || new Date().toISOString(),
        current_price: parseFloat(entry_price),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'account_id,ticket',
      })
      .select()
      .single();

    if (error) {
      console.error('Trade creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create trade' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, trade });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('account_id');

  // Authenticate EA with MT5 Id awareness for switch detection
  const auth = await authenticateEA(request, accountId || undefined);
  if (auth.error) return auth.error;
  const userId = auth.userId;

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing account_id parameter' },
        { status: 400 }
      );
    }

    // Get account
    const { account, error: accountError } = await getOrCreateAccount(userId, accountId);
    if (accountError || !account) {
      return NextResponse.json(
        { error: accountError || 'Account not found' },
        { status: 404 }
      );
    }

    // Get all trades for this account
    const { data: trades, error } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('account_id', account.id)
      .order('open_time', { ascending: false });

    if (error) {
      console.error('Trades fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    return NextResponse.json({ trades });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
