import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_KEY || 'placeholder');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // User Client for Auth only
  const supabase = createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  let { data: { user } } = await supabase.auth.getUser();

  // Fallback to Bearer token if session cookie is missing/invalid
  if (!user) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { data: { user: bearerUser } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
      user = bearerUser;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all accounts for user using Admin client to bypass RLS
    let query = supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);

    // Filter by accountId if provided
    const accountId = request.nextUrl.searchParams.get('accountId');
    if (accountId) {
      query = query.eq('id', accountId);
    }

    const { data: accounts, error: accError } = await query;

    if (accError) throw accError;

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ 
        account: { balance: 0, equity: 0, profit: 0 },
        trades: [],
        stats: {
          netProfit: 0,
          profitFactor: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          lotsTraded: 0
        }
      });
    }

    const accountIds = accounts.map(a => a.id);

    // Get all trades for all accounts using Admin client
    const { data: trades, error: tradesError } = await supabaseAdmin
      .from('trades')
      .select('*')
      .in('account_id', accountIds)
      .order('open_time', { ascending: false });

    if (tradesError) throw tradesError;

    // Aggregate Account Metrics
    const aggregatedAccount = accounts.reduce((acc, curr) => ({
        balance: acc.balance + (curr.balance || 0),
        equity: acc.equity + (curr.equity || 0),
        profit: acc.profit + (curr.profit || 0),
    }), { balance: 0, equity: 0, profit: 0 });

    // Calculate max last_sync_at and shared is_active status
    const lastSyncAt = accounts.reduce((max, curr) => {
        return (!max || (curr.last_sync_at && new Date(curr.last_sync_at) > new Date(max))) 
            ? curr.last_sync_at 
            : max;
    }, null as string | null);

    const anyActive = accounts.some(a => a.is_active);

    // Calculate metrics
    const closedTrades = trades?.filter(t => t.status === 'CLOSED' || t.status === 'ACTIVE') || [];
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) <= 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    const netProfit = totalProfit - totalLoss;
    const profitFactor = totalLoss === 0 ? totalProfit : (totalProfit / totalLoss);
    const winRate = closedTrades.length === 0 ? 0 : (winningTrades.length / closedTrades.length) * 100;
    
    const avgWin = winningTrades.length === 0 ? 0 : totalProfit / winningTrades.length;
    const avgLoss = losingTrades.length === 0 ? 0 : totalLoss / losingTrades.length;
    
    const lotsTraded = trades?.reduce((sum, t) => sum + (t.lot_size || 0), 0) || 0;

    // Symbol exposure
    const symbolMap = new Map();
    trades?.forEach(t => {
      const current = symbolMap.get(t.symbol) || { profit: 0, count: 0 };
      symbolMap.set(t.symbol, {
        profit: current.profit + (t.pnl || 0),
        count: current.count + 1
      });
    });

    const symbolExposure = Array.from(symbolMap.entries()).map(([symbol, data]) => ({
      symbol,
      profit: data.profit,
      weight: (data.count / (trades?.length || 1)) * 100
    })).sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit)).slice(0, 5);

    // Performance Curves (Equity & RR)
    let cumulativePnL = 0;
    let cumulativeR = 0;

    const currentBalance = Number(aggregatedAccount.balance);
    
    // Sort trades for curve construction
    const sortedClosedTrades = [...closedTrades].sort((a: any, b: any) => 
      new Date(a.close_time || a.updated_at).getTime() - new Date(b.close_time || b.updated_at).getTime()
    );

    // Use initial_balance if provided, otherwise reconstruct from netProfit
    // accounts[0].initial_balance is now the source of truth
    let baseEquity = accounts[0].initial_balance > 0 ? Number(accounts[0].initial_balance) : currentBalance;
    
    // If currentBalance is also 0 (brand new account), default to 0 to avoid empty charts panic
    if (baseEquity === 0) baseEquity = 0;

    // Start with the initial point (before any trades)
    const equityCurve = [];
    if (sortedClosedTrades.length > 0) {
        const firstTradeTime = new Date(sortedClosedTrades[0].open_time).toISOString();
        equityCurve.push({
            timestamp: firstTradeTime,
            equity: baseEquity
        });
    }

    sortedClosedTrades.forEach(t => {
      cumulativePnL += (t.pnl || 0);
      equityCurve.push({
        timestamp: t.close_time || t.updated_at,
        equity: baseEquity + cumulativePnL
      });
    });

    const rrCurve = sortedClosedTrades.map(t => {
      let rValue = 0;
      const entry = Number(t.open_price || t.entry_price);
      const exit = Number(t.close_price || t.exit_price);
      const sl = Number(t.sl);
      
      if (sl && entry && sl !== entry) {
        if (t.direction === 'BUY' || t.direction === '0') {
          rValue = (exit - entry) / Math.abs(entry - sl);
        } else {
          rValue = (entry - exit) / Math.abs(entry - sl);
        }
      }
      
      // Sanitize R value
      if (isNaN(rValue) || !isFinite(rValue)) rValue = 0;
      cumulativeR += rValue;
      
      return {
        timestamp: t.close_time || t.updated_at,
        rMultiple: Number(cumulativeR.toFixed(2))
      };
    });

    // Map trades for safe JSON serialization and frontend compatibility
    const mappedTrades = trades?.map(t => ({
      ...t,
      ticket: t.ticket?.toString(),
      lot_size: Number(t.lot_size),
      open_price: Number(t.open_price || 0),
      close_price: Number(t.close_price || 0),
      // Frontend expects result_pnl
      result_pnl: Number(t.pnl || t.floating_pnl || 0),
      // Ensure numeric pnl and floating_pnl for consistency
      pnl: Number(t.pnl || 0),
      floating_pnl: Number(t.floating_pnl || 0),
    })) || [];

    return NextResponse.json({
      account: {
        balance: Number(aggregatedAccount.balance),
        equity: Number(aggregatedAccount.equity),
        profit: Number(aggregatedAccount.profit),
        broker: accounts.length > 1 ? `${accounts.length} Terminals` : (accounts[0]?.broker || "MT5 Terminal"),
        mt5_id: accounts.length > 1 ? "AGGREGATED" : (accounts[0]?.mt5_account_id?.toString() || "Global"),
        initial_balance: accounts[0].initial_balance,
        last_sync_at: lastSyncAt,
        is_active: anyActive,
        account_count: accounts.length
      },
      trades: mappedTrades.slice(0, 50),
      stats: {
        totalProfit: netProfit,
        profitFactor: profitFactor.toFixed(2),
        winRate: Math.round(winRate),
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        lotsTraded: lotsTraded.toFixed(2),
        // New Metric Calculations
        returnPercentage: baseEquity > 0 ? ((netProfit / baseEquity) * 100).toFixed(2) : "0.00",
        cagr: "0.00", // Placeholder for now, requires more historical data context to be meaningful
        avgDailyReturn: "0.00" // Placeholder
      },
      symbolExposure,
      equityCurve,
      rrCurve
    });

  } catch (err) {
    console.error('Stats API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
