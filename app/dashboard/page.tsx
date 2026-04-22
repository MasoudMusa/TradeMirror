"use client";

import { useState, useEffect } from "react";
import { useRealtimeTrades } from "@/hooks/use-realtime-trades";
import { supabase } from "@/lib/supabase";
import AccessTokens from "@/components/AccessTokens";
import { CreateAccountModal } from "@/components/create-account-modal";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  BarChart,
  Activity,
  Box,
  XCircle,
  RefreshCw,
  ArrowRight,
  Wallet,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
} from "recharts";
import { format } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { useAccount } from "@/context/account-context";
import { TradeDetailModal } from "@/components/trade-detail-modal";

export default function DashboardPage() {
  const {
    accountId,
    selectedAccount: account,
    loading: accountLoading,
  } = useAccount();

  const { trades, loading: tradesLoading } = useRealtimeTrades(
    accountId || undefined,
  );
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);

  const fetchStats = async () => {
    // ... rest unchanged
    try {
      const url = accountId
        ? `/api/stats?accountId=${accountId}`
        : "/api/stats";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [accountId]); // Only refetch stats when account changes, not on every trade update

  const handleCommand = async (action: string, ticket: number = 0) => {
    if (
      !confirm(
        `Are you sure you want to ${action}${ticket ? ` for #${ticket}` : ""}?`,
      )
    )
      return;

    try {
      console.log(`Sending command: ${action} for ticket: ${ticket}`);
      alert(
        "Command sent! The EA will process this on its next heartbeat sync.",
      );
    } catch (error) {
      console.error("Command failed:", error);
    }
  };

  const activeTrades = trades.filter((t: any) => t.status === "ACTIVE");
  const currentAccount = account ||
    stats?.account || { profit: 0, equity: 0, balance: 0, is_active: false };

  // Dashboard is loading if we haven't finished fetching account context OR haven't loaded initial stats
  // We allow trades to be loading independently since they trickle in via realtime
  const overallLoading = accountLoading || (statsLoading && !stats);

  if (overallLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="text-slate-400 text-sm font-medium tracking-widest uppercase">
            Initializing Dashboard
          </span>
        </div>
      </div>
    );
  }

  // Handle No Accounts State (only show if specifically in global view and stats say 0 accounts)
  // Or if we don't have an account and accountLoading is done
  const hasNoAccounts =
    !accountLoading && !account && stats?.account?.account_count === 0;

  if (hasNoAccounts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full opacity-50" />
          <div className="relative h-24 w-24 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl">
            <Activity className="h-12 w-12 text-emerald-500" />
          </div>
        </div>

        <div className="text-center space-y-3 max-w-md px-6">
          <h1 className="text-3xl font-black tracking-tight text-white uppercase">
            Welcome Masoud
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Your real-time edge management engine is ready. Connect your first
            MetaTrader 5 account to start journaling and analyzing your
            performance.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <CreateAccountModal onAccountCreated={() => fetchStats()}>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest px-12 h-14 rounded-2xl shadow-xl shadow-emerald-500/20 group uppercase"
            >
              Connect First Account
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CreateAccountModal>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            Institutional Grade Execution & Analytics
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Level Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Net Profit */}
        <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {stats?.stats?.totalProfit >= 0 ? "+" : "-"}$
              {Math.abs(stats?.stats?.totalProfit || 0).toLocaleString()}
            </div>
            <div
              className={`text-[10px] flex items-center gap-1 mt-2 font-bold ${
                (stats?.stats?.totalProfit || 0) >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {(stats?.stats?.totalProfit || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {(stats?.stats?.totalProfit || 0) >= 0 ? "Upward" : "Downward"}
            </div>
          </CardContent>
        </Card>

        {/* Profit Factor */}
        <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-lg">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-white">
            <div className="text-xl font-bold tracking-tight">
              {stats?.stats?.profitFactor || "0.00"}
            </div>
            <div className="text-[10px] text-blue-400 flex items-center gap-1 mt-2 font-bold uppercase tracking-tighter">
              Institutional
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-lg">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl font-bold tracking-tight text-white">
              {stats?.stats?.winRate || 0}%
            </div>
            <div className="w-full bg-slate-800 h-1 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                style={{ width: `${stats?.stats?.winRate || 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Floating PnL */}
        <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-lg">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-400">
              Initial Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-white">
            <div className="text-xl font-bold tracking-tight">
              ${(currentAccount.initial_balance || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">
              {activeTrades.length} ACTIVE
            </div>
          </CardContent>
        </Card>

        {/* Equity */}
        <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-lg">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Account Equity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-white">
            <div className="text-xl font-bold tracking-tight">
              ${(currentAccount.equity || 0).toLocaleString()}
            </div>
            <div
              className={`text-[10px] mt-2 font-bold uppercase ${currentAccount.equity >= currentAccount.balance ? "text-emerald-400" : "text-amber-400"}`}
            >
              {currentAccount.equity >= currentAccount.balance
                ? "Surplus"
                : "Drawdown"}
            </div>
          </CardContent>
        </Card>

        {/* Last Sync */}
        <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-lg">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
              Terminal Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-white truncate">
            <div className="text-xl font-bold tracking-tight truncate">
              {currentAccount.last_sync_at
                ? new Date(currentAccount.last_sync_at).toLocaleTimeString()
                : "NEVER"}
            </div>
            <div
              className={`text-[10px] mt-2 font-bold uppercase ${currentAccount.is_active ? "text-emerald-400" : "text-amber-400"}`}
            >
              {currentAccount.is_active
                ? currentAccount.account_count > 1
                  ? `${currentAccount.account_count} Terminals Connected`
                  : "MT5 Connected"
                : "Standby"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Recent Activity Table */}
        <div className="col-span-12 lg:col-span-8">
          {activeTrades.length > 0 && (
            <>
              <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl overflow-hidden mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-6 space-y-0">
                  <div>
                    <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      Latest Active Orders
                    </CardTitle>
                    <CardDescription className="text-[10px] mt-1 text-slate-500">
                      Real-time status of top 5 active positions
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant="default"
                      className="bg-blue-500 text-white hover:bg-blue-600 border-none px-2 py-0.5 text-[10px] font-bold tracking-widest"
                    >
                      {activeTrades.length} ACTIVE
                    </Badge>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 gap-2 h-8"
                    >
                      <Link href="/dashboard/trades">
                        VIEW ALL <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 text-white">
                  <Table>
                    <TableHeader className="bg-white/[0.02] border-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 px-6 uppercase">
                          Ticket
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 uppercase">
                          Symbol
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 uppercase">
                          Type
                        </TableHead>
                        <TableHead className="text-[10px) font-black uppercase tracking-widest text-muted-foreground py-4 text-right uppercase">
                          Size
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-right uppercase">
                          Profit
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-4 text-right uppercase">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTrades.slice(0, 5).map((trade: any, i: number) => (
                        <TableRow
                          key={i}
                          className="border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                          onClick={() => setSelectedTrade(trade)}
                        >
                          <TableCell className="py-4 px-6 font-mono text-[11px] text-muted-foreground font-bold tracking-tighter">
                            #{trade.ticket}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-xs font-bold tracking-wider text-white">
                              {trade.symbol}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-black px-2 py-0.5 border-0 ${
                                trade.direction?.includes("BUY")
                                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                              }`}
                            >
                              {trade.direction}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-right font-bold text-xs">
                            {trade.lot_size}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <span
                              className={`text-xs font-bold tracking-tight ${
                                (trade.floating_pnl || 0) >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {(trade.floating_pnl || 0) >= 0 ? "+" : "-"}$
                              {Math.abs(
                                trade.floating_pnl || 0,
                              ).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCommand("CLOSE_POSITION", trade.ticket);
                              }}
                              className="h-7 text-[10px] font-bold text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              EXIT
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Yellow Institutional Divider */}
              <div className="flex items-center gap-4 mb-8 opacity-80">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                  <span className="text-[9px] font-black text-yellow-500/70 tracking-[0.4em] uppercase">
                    Performance Analytics
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-yellow-500/50 via-yellow-500/50 to-transparent" />
              </div>
            </>
          )}

          {/* Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
            {/* Equity Curve */}
            <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      Equity Growth
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">
                      Cumulative Account Value
                    </CardDescription>
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500/50" />
                </div>
              </CardHeader>
              <CardContent className="h-48 p-0 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats?.equityCurve || []}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorEquityDashboard"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff05"
                      vertical={false}
                    />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={["dataMin - 1000", "auto"]} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1120",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "#10b981" }}
                      labelFormatter={(label) => {
                        try {
                          return format(new Date(label), "MMM dd, HH:mm");
                        } catch (e) {
                          return label;
                        }
                      }}
                      formatter={(value: any) => [
                        `$${value.toLocaleString()}`,
                        "Equity",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEquityDashboard)"
                      animationDuration={1000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Drawdown Curve */}
            <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      Drawdown
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">
                      Cumulative drawdown
                    </CardDescription>
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500/50" />
                </div>
              </CardHeader>
              <CardContent className="h-48 p-0 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats?.equityCurve || []}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorEquityDashboard"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff08"
                      vertical={false}
                    />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1120",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "#10b981" }}
                      labelFormatter={(label) => {
                        try {
                          return format(new Date(label), "MMM dd, HH:mm");
                        } catch (e) {
                          return label;
                        }
                      }}
                      formatter={(value: any) => [
                        `$${value.toLocaleString()}`,
                        "Equity",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEquityDashboard)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* RR Curve */}
            <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      RR Curve
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">
                      Cumulative Risk/Reward Multiples
                    </CardDescription>
                  </div>
                  <Activity className="h-4 w-4 text-blue-500/50" />
                </div>
              </CardHeader>
              <CardContent className="h-48 p-0 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats?.rrCurve || []}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff05"
                      vertical={false}
                    />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1120",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "#3b82f6" }}
                      labelFormatter={(label) => {
                        try {
                          return format(new Date(label), "MMM dd, HH:mm");
                        } catch (e) {
                          return label;
                        }
                      }}
                      formatter={(value: any) => [`${value}R`, "Current R"]}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="rMultiple"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* RR Curve */}
            <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl overflow-hidden group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
                      RR Curve
                    </CardTitle>
                    <CardDescription className="text-[10px] text-slate-500">
                      Cumulative Risk/Reward Multiples
                    </CardDescription>
                  </div>
                  <Activity className="h-4 w-4 text-blue-500/50" />
                </div>
              </CardHeader>
              <CardContent className="h-48 p-0 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats?.rrCurve || []}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff05"
                      vertical={false}
                    />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={["auto", "auto"]} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1120",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "8px",
                        fontSize: "10px",
                      }}
                      itemStyle={{ color: "#3b82f6" }}
                      labelFormatter={(label) => {
                        try {
                          return format(new Date(label), "MMM dd, HH:mm");
                        } catch (e) {
                          return label;
                        }
                      }}
                      formatter={(value: any) => [`${value}R`, "Current R"]}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="rMultiple"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Cards Area */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Access Tokens */}
          <AccessTokens />

          {/* Remote Controls */}
          <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0 text-white">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Remote Control
              </CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="destructive"
                className="w-full justify-start bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 border text-[11px] font-bold uppercase tracking-widest"
                onClick={() => handleCommand("CLOSE_ALL")}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Terminate All Positions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-white/5 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 text-[11px] font-bold uppercase tracking-widest"
                onClick={() => handleCommand("BREAKEVEN_ALL")}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Secure Breakeven All
              </Button>
            </CardContent>
          </Card>

          {/* Symbol Performance */}
          <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-6 space-y-0 text-white">
              <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Symbol Weight
              </CardTitle>
              <Button
                asChild
                variant="link"
                size="sm"
                className="h-auto p-0 text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
              >
                <Link href="/dashboard/analytics">FULL ANALYSIS</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {stats?.symbolExposure && stats.symbolExposure.length > 0 ? (
                stats.symbolExposure
                  .slice(0, 3)
                  .map((symbol: any, index: number) => {
                    const colors = [
                      {
                        bg: "bg-yellow-500",
                        shadow: "shadow-[0_0_8px_rgba(234,179,8,0.3)]",
                        glow: "shadow-[0_0_8px_rgba(234,179,8,0.5)]",
                      },
                      {
                        bg: "bg-blue-500",
                        shadow: "shadow-[0_0_8px_rgba(59,130,246,0.3)]",
                        glow: "shadow-[0_0_8px_rgba(59,130,246,0.5)]",
                      },
                      {
                        bg: "bg-purple-500",
                        shadow: "shadow-[0_0_8px_rgba(168,85,247,0.3)]",
                        glow: "shadow-[0_0_8px_rgba(168,85,247,0.5)]",
                      },
                    ];
                    const color = colors[index % 3];
                    const isProfit = symbol.profit >= 0;

                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center text-white">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${isProfit ? color.bg : "bg-red-500"} ${isProfit ? color.shadow : "shadow-[0_0_8px_rgba(239,68,68,0.3)]"}`}
                            ></div>
                            <span className="text-xs font-bold">
                              {symbol.symbol}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {isProfit ? "+" : "-"}$
                            {Math.abs(symbol.profit).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div
                            className={`${isProfit ? color.bg : "bg-red-500"} h-full rounded-full ${isProfit ? color.glow : "shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                            style={{ width: `${symbol.weight}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="py-8 text-center opacity-30 flex flex-col items-center gap-2">
                  <BarChart className="h-6 w-6" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    Awaiting Execution Data
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TradeDetailModal
        trade={selectedTrade}
        isOpen={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}
