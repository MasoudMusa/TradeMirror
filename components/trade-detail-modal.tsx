"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Tag,
  Hash,
  FileText,
  TrendingUp,
  TrendingDown,
  Monitor,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Trade {
  id: string;
  ticket: number;
  symbol: string;
  direction: string | null;
  lot_size: number | null;
  entry_price: number | null;
  exit_price: number | null;
  status: string | null;
  open_time: string | null;
  close_time: string | null;
  pnl: number | null;
  commission: number | null;
  swap: number | null;
  magic?: number | null;
  comment?: string | null;
  created_at: string;
}

interface TradeEvent {
  id: string;
  event_type: string;
  timestamp: string;
  screenshot: string | null;
  data: any;
}

interface TradeDetailModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TradeDetailModal({
  trade,
  isOpen,
  onClose,
}: TradeDetailModalProps) {
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!trade?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("trade_events")
        .select("*")
        .eq("trade_id", trade.id)
        .order("timestamp", { ascending: true });

      if (!error && data) {
        setEvents(data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, [trade?.id]);

  useEffect(() => {
    if (isOpen && trade?.id) {
      fetchEvents();

      // Subscribe to real-time updates for this trade's events
      const channel = supabase
        .channel(`trade-events-${trade.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "trade_events",
            filter: `trade_id=eq.${trade.id}`,
          },
          (payload) => {
            console.log("Event update:", payload);

            if (payload.eventType === "INSERT") {
              setEvents((current) =>
                [...current, payload.new as TradeEvent].sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime(),
                ),
              );
            } else if (payload.eventType === "UPDATE") {
              setEvents((current) =>
                current.map((event) =>
                  event.id === payload.new.id
                    ? (payload.new as TradeEvent)
                    : event,
                ),
              );
            } else if (payload.eventType === "DELETE") {
              setEvents((current) =>
                current.filter((event) => event.id !== payload.old.id),
              );
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, trade?.id, fetchEvents]);

  const handleUpload = async (file: File) => {
    if (!trade?.id || uploading) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tradeId", trade.id);

      const response = await fetch("/api/trade/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        await fetchEvents();
      } else {
        const err = await response.json();
        alert(`Upload failed: ${err.error}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) handleUpload(file);
      }
    }
  };

  if (!trade) return null;

  const isProfit = (trade.pnl || 0) >= 0;
  const duration =
    trade.open_time && trade.close_time
      ? Math.abs(
          new Date(trade.close_time).getTime() -
            new Date(trade.open_time).getTime(),
        )
      : null;

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m`;
    return `${mins}m`;
  };

  const screenEvents = events.filter((e) => e.screenshot);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-5xl bg-[#0B1120] border-white/5 text-white p-0 overflow-hidden shadow-2xl focus:outline-none"
        onPaste={handlePaste}
      >
        <div className="flex flex-col lg:flex-row h-full max-h-[90vh]">
          {/* Left Panel: Details */}
          <div className="flex-1 p-8 overflow-y-auto border-r border-white/5 bg-[#0D1525]">
            <DialogHeader className="mb-8">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="bg-white/5 text-slate-400 border-white/10 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase"
                >
                  Execution Report
                </Badge>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  #{trade.ticket}
                </span>
              </div>
              <DialogTitle className="text-3xl font-black mt-2 flex items-center gap-3">
                {trade.symbol}
                <Badge
                  className={
                    trade.direction === "BUY"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }
                >
                  {trade.direction}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-1 font-medium">
                Detailed audit for order {trade.ticket} execution on MT5
                Terminal
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <DetailItem
                  icon={TrendingUp}
                  label="Net Profit"
                  value={`$${Math.abs(trade.pnl || 0).toLocaleString()}`}
                  color={isProfit ? "text-emerald-400" : "text-red-400"}
                />
                <DetailItem
                  icon={Tag}
                  label="Lot Size"
                  value={(trade.lot_size || 0).toFixed(2)}
                />
                <DetailItem
                  icon={Hash}
                  label="Open Price"
                  value={(trade.entry_price || 0).toFixed(5)}
                  fontMono
                />
                <DetailItem
                  icon={Hash}
                  label="Close Price"
                  value={
                    trade.exit_price ? trade.exit_price.toFixed(5) : "ACTIVE"
                  }
                  fontMono
                />
              </div>
              <div className="space-y-6">
                <DetailItem
                  icon={Calendar}
                  label="Open Time"
                  value={
                    trade.open_time
                      ? new Date(trade.open_time).toLocaleString()
                      : trade.created_at
                        ? new Date(trade.created_at).toLocaleString()
                        : "N/A"
                  }
                  small
                />
                <DetailItem
                  icon={Clock}
                  label="Duration"
                  value={
                    duration
                      ? formatDuration(duration)
                      : trade.status === "ACTIVE"
                        ? "Ongoing"
                        : "N/A"
                  }
                />
                <DetailItem
                  icon={Monitor}
                  label="Status"
                  value={trade.status || "UNKNOWN"}
                  color={
                    trade.status === "ACTIVE"
                      ? "text-blue-400"
                      : "text-slate-400"
                  }
                />
                <DetailItem
                  icon={FileText}
                  label="Commission"
                  value={`-$${(trade.commission || 0).toFixed(2)}`}
                />
              </div>
            </div>

            <Separator className="my-8 bg-white/5" />

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Terminal Metadata
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Magic Number
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {trade.magic || "0"}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Swap
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    ${(trade.swap || 0).toFixed(2)}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                  <span className="block text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Comment
                  </span>
                  <span className="text-xs font-medium text-slate-400 truncate">
                    {trade.comment || "No comment"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Screenshot Grid */}
          <div className="w-full lg:w-[450px] bg-[#090F1B] p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-emerald-400" />
                Context
              </h3>
              <div className="flex items-center gap-3">
                {loading && (
                  <RefreshCw className="h-3 w-3 animate-spin text-slate-600" />
                )}
                <Badge
                  variant="secondary"
                  className="bg-white/5 text-slate-500 border-0 text-[10px]"
                >
                  {screenEvents.length} Captures
                </Badge>
              </div>
            </div>

            {screenEvents.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {screenEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group relative aspect-video rounded-xl overflow-hidden border border-white/5 hover:border-emerald-500/50 transition-all cursor-zoom-in shadow-xl shadow-black/40"
                  >
                    <img
                      src={event.screenshot || ""}
                      alt={event.event_type}
                      className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-110 group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] to-transparent opacity-60" />
                    <div className="absolute bottom-2 left-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">
                        {event.event_type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !loading && (
                <div className="aspect-video rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-3 text-slate-600">
                  <ImageIcon className="h-8 w-8 opacity-20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                    No evidence recorded
                  </span>
                </div>
              )
            )}

            <div className="mt-8 space-y-4">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center gap-3 group hover:border-emerald-500/20 transition-colors">
                <div
                  className={`p-3 rounded-full bg-slate-900 border border-white/5 ${uploading ? "animate-pulse" : ""}`}
                >
                  {uploading ? (
                    <RefreshCw className="h-5 w-5 text-emerald-500 animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-white font-black uppercase tracking-[0.15em]">
                    {uploading ? "UPLOADING..." : "Add Context"}
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium uppercase tracking-[0.05em] leading-relaxed">
                    Paste an image anywhere or drag & drop to attach evidence
                  </p>
                </div>
                <input
                  type="file"
                  id="evidence-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] && handleUpload(e.target.files[0])
                  }
                />
                <Button
                  variant="ghost"
                  asChild
                  className="h-8 text-[10px] font-bold text-emerald-400/70 hover:text-emerald-400 hover:bg-transparent"
                >
                  <label
                    htmlFor="evidence-upload"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="h-3 w-3" /> SELECT FILE
                  </label>
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-[9px] text-indigo-400/80 font-medium leading-relaxed italic text-center">
                  Tip: Use Win + Shift + S to snip and Ctrl + V to paste
                  evidence instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  color = "text-white",
  fontMono = false,
  small = false,
}: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-white/5 mt-1">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div>
        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          {label}
        </span>
        <span
          className={`block font-black tracking-tight ${color} ${fontMono ? "font-mono" : ""} ${small ? "text-xs" : "text-lg"}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
