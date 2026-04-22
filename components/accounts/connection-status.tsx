"use client";

import {
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Wifi,
  RefreshCw,
} from "lucide-react";

interface ConnectionStatusProps {
  terminalConnected: boolean;
  eaRunning: boolean;
  internetAvailable: boolean;
  lastHeartbeat: string | null;
  sessionUptime: string;
  reconnectCountToday: number;
}

export function ConnectionStatus({
  terminalConnected,
  eaRunning,
  internetAvailable,
  lastHeartbeat,
  sessionUptime,
  reconnectCountToday,
}: ConnectionStatusProps) {
  const items = [
    { label: "Terminal Connected", value: terminalConnected, type: "boolean" },
    { label: "EA Running", value: eaRunning, type: "boolean" },
    { label: "Internet", value: internetAvailable, type: "boolean" },
    { label: "Last Heartbeat", value: lastHeartbeat || "Never", type: "text" },
    { label: "Session Uptime", value: sessionUptime, type: "text" },
    { label: "Reconnects Today", value: reconnectCountToday, type: "text" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
        Connection
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              {item.type === "boolean" ? (
                <>
                  {item.value ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${item.value ? "text-slate-200" : "text-slate-400"}`}
                  >
                    {item.value ? "Stable" : "Offline"}
                  </span>
                </>
              ) : (
                <span className="text-sm font-mono font-medium text-slate-200 truncate">
                  {item.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
