"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Clock, ChevronRight, Eye } from "lucide-react";

interface CompactAccountCardProps {
  name: string;
  platform: string;
  accountNumber: string | null;
  status: "active" | "offline" | "warning" | "revoked" | "archived";
  lastSeen: string | null;
  onView: () => void;
  onActivate: () => void;
}

export function CompactAccountCard({
  name,
  platform,
  accountNumber,
  status,
  lastSeen,
  onView,
  onActivate,
}: CompactAccountCardProps) {
  const statusColors = {
    active: "bg-emerald-500/5 text-emerald-400 border-emerald-500/20",
    offline: "bg-red-500/5 text-red-400 border-red-500/20",
    warning: "bg-amber-500/5 text-amber-400 border-amber-500/20",
    revoked: "bg-slate-500/5 text-slate-400 border-slate-500/20",
    archived: "bg-purple-500/5 text-purple-400 border-purple-500/20",
  };

  return (
    <Card className="bg-[#0B1120] border-white/5 hover:border-white/10 transition-colors group">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                {name}
              </h4>
              <Badge
                variant="outline"
                className={`text-[9px] px-1.5 py-0 h-4 ${statusColors[status]}`}
              >
                {status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono">
                {accountNumber || "Wait for Sync"}
              </span>
              <span className="text-[10px] text-slate-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastSeen ? new Date(lastSeen).toLocaleDateString() : "Never"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-slate-400 hover:text-white"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10"
            onClick={onActivate}
          >
            Activate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
