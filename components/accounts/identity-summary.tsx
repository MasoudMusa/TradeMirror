"use client";

import { Badge } from "@/components/ui/badge";
import { Smartphone, Globe, Server, User } from "lucide-react";

interface IdentitySummaryProps {
  accountName: string;
  platform: string;
  accountNumber: string | null;
  server: string | null;
  broker: string | null;
  status: "active" | "offline" | "warning" | "revoked" | "archived";
}

export function IdentitySummary({
  accountName,
  platform,
  accountNumber,
  server,
  broker,
  status,
}: IdentitySummaryProps) {
  const statusColors = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    offline: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    revoked: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    archived: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <User className="h-6 w-6 text-indigo-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{accountName}</h2>
            <Badge variant="outline" className={statusColors[status]}>
              {status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            {broker || "No Broker Connected"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Platform
          </span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Smartphone className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-sm font-medium">{platform}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Account ID
          </span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="text-sm font-mono font-medium">
              {accountNumber || "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Server
          </span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Server className="h-3.5 w-3.5 text-indigo-400" />
            <span
              className="text-sm truncate max-w-[120px] font-medium"
              title={server || ""}
            >
              {server || "—"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Region
          </span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Globe className="h-3.5 w-3.5 text-indigo-400" />
            <span className="text-sm font-medium">Auto-Detect</span>
          </div>
        </div>
      </div>
    </div>
  );
}
