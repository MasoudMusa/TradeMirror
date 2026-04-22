import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Sync endpoint - returns all active trades for reconciliation
 */
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

    // Get all active trades
    const { data: trades, error } = await supabaseAdmin
      .from('trades')
      .select('*')
      .eq('account_id', account.id)
      .eq('status', 'ACTIVE')
      .order('open_time', { ascending: false });

    if (error) {
      console.error('Sync fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      trades: trades || [],
      account: {
        id: account.id,
        mt5_account_id: account.mt5_account_id,
        balance: account.balance,
        equity: account.equity,
      }
    });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Close trade endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account_id, ticket, exit_price, close_time, pnl, commission, swap } = body;

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

    // Get account
    const { account, error: accountError } = await getOrCreateAccount(userId, account_id);
    if (accountError || !account) {
      return NextResponse.json(
        { error: accountError || 'Account not found' },
        { status: 404 }
      );
    }

    // Update trade to closed
    const { data: trade, error } = await supabaseAdmin
      .from('trades')
      .update({
        status: 'CLOSED',
        exit_price: parseFloat(exit_price),
        close_time: close_time || new Date().toISOString(),
        pnl: parseFloat(pnl),
        commission: commission ? parseFloat(commission) : null,
        swap: swap ? parseFloat(swap) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('account_id', account.id)
      .eq('ticket', BigInt(ticket))
      .select()
      .single();

    if (error) {
      console.error('Trade close error:', error);
      return NextResponse.json(
        { error: 'Failed to close trade' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, trade });
  } catch (err) {
    console.error('Close trade error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
