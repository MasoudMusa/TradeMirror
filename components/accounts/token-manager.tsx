"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  RefreshCw,
  Trash2,
  Check,
  Shield,
  Calendar,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/utils";

interface TokenManagerProps {
  maskedToken: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  status: "valid" | "expired" | "revoked";
  onCopy: () => void;
  onRotate: () => void;
  onRevoke: () => void;
}

export function TokenManager({
  maskedToken,
  permissions,
  createdAt,
  lastUsed,
  expiresAt,
  status,
  onCopy,
  onRotate,
  onRevoke,
}: TokenManagerProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  const handleCopy = () => {
    onCopy();
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRotate = async () => {
    setIsRotating(true);
    try {
      await onRotate();
    } finally {
      setIsRotating(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await onRevoke();
      setRevokeOpen(false);
    } finally {
      setIsRevoking(false);
    }
  };

  const statusColors = {
    valid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    expired: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    revoked: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            Access Token
          </h3>
          <Badge
            variant="outline"
            className={`ml-2 text-[10px] ${statusColors[status]}`}
          >
            {status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-slate-400 hover:text-white"
            onClick={handleCopy}
          >
            {isCopied ? (
              <Check className="h-3 w-3 mr-1.5 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3 mr-1.5" />
            )}
            Copy
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-slate-400 hover:text-white"
            onClick={handleRotate}
            disabled={isRotating}
          >
            <RefreshCw
              className={`h-3 w-3 mr-1.5 ${isRotating ? "animate-spin" : ""}`}
            />
            {isRotating ? "Rotating..." : "Rotate"}
          </Button>

          <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Revoke
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0B1120] border-white/10 text-white max-w-sm">
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-red-500/10 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <DialogTitle className="text-center">
                  Revoke this token?
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-center">
                  Revoking this token will immediately stop the EA from syncing.
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 sm:justify-center mt-4">
                <Button
                  variant="ghost"
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  onClick={() => setRevokeOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRevoke}
                  className="bg-red-500 hover:bg-red-600 border-0"
                  disabled={isRevoking}
                >
                  {isRevoking ? "Revoking..." : "Revoke Token"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <code className="block rounded-lg bg-[#02040a] p-3 font-mono text-sm text-indigo-300 border border-white/5 tracking-wider">
            {maskedToken}
          </code>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Permissions
          </span>
          <div className="flex flex-wrap gap-1.5">
            {permissions.map((p, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-white/5 text-slate-300 text-[10px] border-white/10"
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            History
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="h-3 w-3" />
              Created:{" "}
              <span className="text-slate-200">
                {new Date(createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              Last Used:{" "}
              <span className="text-slate-200">
                {formatRelativeTime(lastUsed)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Expiration
          </span>
          <div className="text-xs text-slate-400">
            {expiresAt ? (
              <span className="text-slate-200">
                {new Date(expiresAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">
                Never Expires
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
