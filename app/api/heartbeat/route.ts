import { NextRequest, NextResponse } from 'next/server';
import { authenticateEA, getOrCreateAccount } from '@/lib/ea-auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Account heartbeat endpoint
 * Updates account metrics and trade floating P&L
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      account_id, 
      balance, 
      equity, 
      profit, 
      margin, 
      free_margin,
      open_trades 
    } = body;

    // Authenticate EA with MT5 Account ID for switch detection
    const auth = await authenticateEA(request, account_id ? String(account_id) : undefined);
    if (auth.error) return auth.error;
    const userId = auth.userId;
    if (!account_id) {
      return NextResponse.json(
        { error: 'Missing account_id' },
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

    // Update account metrics
    const { error: updateError } = await supabaseAdmin
      .from('accounts')
      .update({
        balance: parseFloat(balance),
        equity: parseFloat(equity),
        profit: parseFloat(profit),
        margin: parseFloat(margin),
        free_margin: parseFloat(free_margin),
        last_heartbeat_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('Account update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }

    // Update open trades with current prices and floating P&L
    if (open_trades && Array.isArray(open_trades)) {
      for (const trade of open_trades) {
        await supabaseAdmin
          .from('trades')
          .update({
            current_price: parseFloat(trade.current_price),
            floating_pnl: parseFloat(trade.floating_pnl),
            updated_at: new Date().toISOString(),
          })
          .eq('account_id', account.id)
          .eq('ticket', BigInt(trade.ticket));
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Heartbeat received',
      account_id: account.id,
    });
  } catch (err) {
    console.error('Heartbeat error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
