"use client";

import { useState, useEffect } from "react";
import { getStats, sendCommand } from "@/lib/api";
import {
  Calendar as CalendarIcon,
  Search,
  Download,
  ShieldCheck,
  XCircle,
  Box,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useAccount } from "@/context/account-context";
import { TradeDetailModal } from "@/components/trade-detail-modal";
import { useRealtimeTrades } from "@/hooks/use-realtime-trades";

import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";

export default function HistoryPage() {
  const { accountId } = useAccount();

  const { trades, loading } = useRealtimeTrades(accountId || undefined);
  const [filter, setFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const pageSize = 10;

  const handleCommand = async (action: string, ticket: number) => {
    if (confirm(`Execute ${action} for ticket #${ticket}?`)) {
      await sendCommand(action, ticket);
    }
  };

  const filteredTrades = trades
    .filter((t) => {
      const matchesSearch =
        t.symbol?.toLowerCase().includes(filter.toLowerCase()) ||
        t.ticket?.toString().includes(filter) ||
        t.comment?.toLowerCase().includes(filter.toLowerCase());

      // Date Filtering Logic
      let matchesDate = true;
      if (dateRange?.from) {
        const tradeDate = new Date(t.created_at);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          matchesDate = tradeDate >= fromDate && tradeDate <= toDate;
        } else {
          matchesDate = tradeDate >= fromDate;
        }
      }

      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    })
    .filter((t) => {
      const matchesStatus =
        selectedStatus === "ALL" || t.status === selectedStatus;
      const matchesType =
        selectedType === "ALL" || t.direction === selectedType;
      return matchesStatus && matchesType;
    });

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / pageSize));
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, dateRange, selectedStatus, selectedType]);

  if (loading && trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight italic">Trades</h1>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.2em] mt-1">
            All your Mt5 trades
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/5 rounded-lg px-2 py-1 gap-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground px-1 border-r border-white/10 pr-2 h-4 flex items-center">
              Filters
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-white border-0 focus:ring-0 active:ring-0 cursor-pointer h-8 uppercase tracking-tighter"
            >
              <option value="ALL" className="bg-slate-900">
                All Status
              </option>
              <option value="ACTIVE" className="bg-slate-900">
                Active
              </option>
              <option value="CLOSED" className="bg-slate-900">
                Closed
              </option>
            </select>
            <Separator orientation="vertical" className="h-4 bg-white/10" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-white border-0 focus:ring-0 active:ring-0 cursor-pointer h-8 uppercase tracking-tighter"
            >
              <option value="ALL" className="bg-slate-900">
                All Types
              </option>
              <option value="BUY" className="bg-slate-900">
                Buy
              </option>
              <option value="SELL" className="bg-slate-900">
                Sell
              </option>
            </select>
            <Separator orientation="vertical" className="h-4 bg-white/10" />
            <div className="flex items-center gap-2 pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">
                Period
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"ghost"}
                    className={cn(
                      "h-8 justify-start text-left font-bold text-[11px] hover:bg-white/5 px-2 min-w-[210px]",
                      !dateRange && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 text-emerald-400" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-slate-900 border-white/5"
                  align="start"
                >
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    className="text-white"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search ticket/symbol..."
              className="pl-9 h-10 bg-white/5 border-white/5 text-xs font-medium focus-visible:ring-emerald-500/30 transition-all placeholder:text-muted-foreground"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="h-10 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-400 text-[10px] uppercase font-bold tracking-widest gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="bg-[#0B1120]/50 backdrop-blur-md border-white/5 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="border-white/5 bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Ticket
                </TableHead>
                <TableHead className="py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Symbol
                </TableHead>
                <TableHead className="py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Type
                </TableHead>
                <TableHead className="py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Lots
                </TableHead>
                <TableHead className="py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none text-right">
                  Entry / Exit
                </TableHead>
                <TableHead className="py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none text-right">
                  Profit
                </TableHead>
                <TableHead className="py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  Status
                </TableHead>
                <TableHead className="py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-white/[0.03]">
              {paginatedTrades.map((trade, i) => (
                <TableRow
                  key={i}
                  className="border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => setSelectedTrade(trade)}
                >
                  <TableCell className="py-5">
                    <span className="text-[11px] font-mono text-muted-foreground font-bold tracking-tighter">
                      #{trade.ticket}
                    </span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-bold group-hover:border-emerald-500/20 transition-all">
                        {trade.symbol.substring(0, 2)}
                      </div>
                      <span className="text-xs font-bold tracking-wider">
                        {trade.symbol}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-black px-2 py-0.5 uppercase tracking-widest border-0 rounded-md ${
                        trade.direction === "BUY"
                          ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20"
                          : "bg-red-500/10 text-red-500 ring-1 ring-red-500/20"
                      }`}
                    >
                      {trade.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5 text-xs font-bold">
                    {trade.lot_size}
                  </TableCell>
                  <TableCell className="py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">
                          IN
                        </span>
                        <span className="text-[11px] text-emerald-400 font-bold font-mono tracking-tighter leading-none">
                          {(trade.entry_price || 0).toFixed(5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          OUT
                        </span>
                        <span
                          className={`text-[10px] font-bold font-mono tracking-tighter leading-none ${trade.exit_price ? "text-slate-300" : "text-amber-500/50"}`}
                        >
                          {trade.exit_price
                            ? trade.exit_price.toFixed(5)
                            : "---"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-right">
                    <span
                      className={`text-xs font-bold tracking-tight ${
                        (trade.pnl || 0) >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {(trade.pnl || 0) >= 0 ? "+" : "-"}$
                      {Math.abs(trade.pnl || 0).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          trade.status === "ACTIVE"
                            ? "bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"
                            : "bg-slate-700"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          trade.status === "ACTIVE"
                            ? "text-blue-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {trade.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCommand("BREAKEVEN", trade.ticket)}
                        className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-400"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCommand("CLOSE_POSITION", trade.ticket)
                        }
                        className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredTrades.length)} of{" "}
                {filteredTrades.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="h-8 border-white/5 bg-white/5 text-[10px] font-bold uppercase hover:bg-white/10 disabled:opacity-30"
                >
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const range = [];
                    const total = totalPages;
                    const current = currentPage;
                    const delta = 1; // pages before and after current

                    for (let i = 1; i <= total; i++) {
                      if (
                        i === 1 ||
                        i === total ||
                        (i >= current - delta && i <= current + delta)
                      ) {
                        range.push(i);
                      } else if (range[range.length - 1] !== "...") {
                        range.push("...");
                      }
                    }

                    return range.map((page, idx) =>
                      page === "..." ? (
                        <span
                          key={`dots-${idx}`}
                          className="px-2 text-slate-600 font-bold text-[10px]"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page as number)}
                          className={`h-8 w-8 p-0 text-[10px] font-bold ${
                            currentPage === page
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "text-muted-foreground"
                          }`}
                        >
                          {page}
                        </Button>
                      ),
                    );
                  })()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="h-8 border-white/5 bg-white/5 text-[10px] font-bold uppercase hover:bg-white/10 disabled:opacity-30"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          {filteredTrades.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center bg-white/[0.01]">
              <Box className="h-12 w-12 text-muted-foreground mb-4" />
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em]">
                Operational Log Empty
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      <TradeDetailModal
        trade={selectedTrade}
        isOpen={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
}
