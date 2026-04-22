"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Wifi, WifiOff, Activity } from "lucide-react";

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [mt5Status, setMt5Status] = useState<
    "connected" | "idle" | "disconnected"
  >("idle");

  useEffect(() => {
    // Monitor Supabase Realtime connection
    const channel = supabase.channel("connection-monitor");

    channel
      .on("system", { event: "connected" }, () => {
        setIsConnected(true);
      })
      .on("system", { event: "disconnected" }, () => {
        setIsConnected(false);
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    // Monitor MT5 connection via last_sync_at
    const checkMt5Connection = async () => {
      try {
        const { data: accounts } = await supabase
          .from("accounts")
          .select("last_sync_at, is_active")
          .eq("is_active", true)
          .order("last_sync_at", { ascending: false })
          .limit(1);

        if (accounts && accounts.length > 0) {
          const lastSync = new Date(accounts[0].last_sync_at || 0);
          const now = new Date();
          const diffSeconds = (now.getTime() - lastSync.getTime()) / 1000;

          if (diffSeconds < 30) {
            setMt5Status("connected");
          } else if (diffSeconds < 120) {
            setMt5Status("idle");
          } else {
            setMt5Status("disconnected");
          }
        }
      } catch (err) {
        console.error("MT5 status check failed:", err);
      }
    };

    checkMt5Connection();
    const interval = setInterval(checkMt5Connection, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 shadow-lg">
      {/* Supabase Realtime */}
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-red-500" />
        )}
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          {isConnected ? "Live" : "Offline"}
        </span>
      </div>

      {/* MT5 Status */}
      <div className="flex items-center gap-1.5 border-l border-white/10 pl-2">
        <Activity
          className={`h-3.5 w-3.5 ${
            mt5Status === "connected"
              ? "text-emerald-500 animate-pulse"
              : mt5Status === "idle"
                ? "text-yellow-500"
                : "text-slate-500"
          }`}
        />
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
          MT5
        </span>
      </div>
    </div>
  );
}
