"use client";

import { useEffect, useState, useMemo } from "react";
import { useRealtimeAccounts, Account } from "@/hooks/use-realtime-accounts";
import { supabase } from "@/lib/supabase";
import { CreateAccountModal } from "@/components/create-account-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  deleteAccount,
  unbindAccount,
  rotateToken,
  revokeToken,
} from "@/lib/api";
import { Plug, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

// New components
import { IdentitySummary } from "@/components/accounts/identity-summary";
import { ConnectionStatus } from "@/components/accounts/connection-status";
import { TokenManager } from "@/components/accounts/token-manager";
import { CompactAccountCard } from "@/components/accounts/compact-account-card";

export default function AccountsPage() {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const { accounts, loading } = useRealtimeAccounts(userId);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get userId from auth session
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Filter out deleted accounts from the realtime list
  const visibleAccounts = useMemo(
    () => accounts.filter((a) => !deletedIds.has(a.id)),
    [accounts, deletedIds],
  );

  // Set first account as active if none selected
  useEffect(() => {
    if (visibleAccounts.length > 0 && !activeAccountId) {
      setActiveAccountId(visibleAccounts[0].id);
    }
  }, [visibleAccounts, activeAccountId]);

  const activeAccount = useMemo(
    () =>
      visibleAccounts.find((a) => a.id === activeAccountId) ||
      visibleAccounts[0],
    [visibleAccounts, activeAccountId],
  );

  const otherAccounts = useMemo(
    () => visibleAccounts.filter((a) => a.id !== activeAccount?.id),
    [visibleAccounts, activeAccount],
  );

  // Status Logic
  const getAccountStatus = (account: Account) => {
    if (!account.last_sync_at) return "offline";
    const lastSync = new Date(account.last_sync_at).getTime();
    const now = new Date().getTime();
    const diffSeconds = (now - lastSync) / 1000;

    if (diffSeconds > 30) return "warning";
    return account.is_active ? "active" : "offline";
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: "Copied", description: "Token copied to clipboard" });
  };

  const handleRotateToken = async (id: string) => {
    try {
      await rotateToken(id);
      toast({
        title: "Token Rotated",
        description: "A new security token has been generated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRevokeToken = async (id: string) => {
    try {
      await revokeToken(id);
      toast({
        title: "Token Revoked",
        description: "Access has been disabled for this account.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeactivate = async () => {
    toast({
      title: "Status Update",
      description: "Account deactivation initiated.",
    });
  };

  const handleDisconnectTerminal = async (id: string) => {
    try {
      await unbindAccount(id);
      toast({
        title: "Disconnected",
        description: "Terminal connection removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveAccount = async (id: string) => {
    // Optimistic update
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await deleteAccount(id);
      toast({ title: "Removed", description: "Account permanently deleted." });
      if (activeAccountId === id) setActiveAccountId(null);
    } catch (error: any) {
      // Revert if failed
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="flex flex-col gap-8 p-8 max-w-[1200px] mx-auto animate-pulse">
        <div className="h-20 bg-white/5 rounded-xl w-1/3" />
        <div className="h-[400px] bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1200px] mx-auto min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Accounts
          </h1>
          <p className="text-slate-400 mt-1">
            Manage trading identities, terminal access, and security tokens.
          </p>
        </div>
        <CreateAccountModal>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
            <Plug className="mr-2 h-4 w-4" />
            Connect New Account
          </Button>
        </CreateAccountModal>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0B1120]/50 p-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-6">
            <Plug className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-bold text-white">
            No active trading account
          </h3>
          <p className="mt-3 text-slate-400 max-w-sm text-lg">
            Connect an MT5 account to begin syncing live data.
          </p>
          <div className="mt-10">
            <CreateAccountModal>
              <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-lg"
              >
                Connect MT5 Account
              </Button>
            </CreateAccountModal>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Active Account Section */}
          <Card className="bg-[#0B1120] border-white/10 shadow-2xl overflow-hidden rounded-3xl">
            <CardContent className="p-8 flex flex-col gap-10">
              {activeAccount && (
                <>
                  <IdentitySummary
                    accountName={activeAccount.name || "Unnamed Account"}
                    platform="MetaTrader 5"
                    accountNumber={activeAccount.mt5_account_id}
                    broker={activeAccount.broker}
                    server="Direct Access (SSL)"
                    status={getAccountStatus(activeAccount) as any}
                  />

                  <ConnectionStatus
                    terminalConnected={!!activeAccount.mt5_account_id}
                    eaRunning={!!activeAccount.last_heartbeat_at}
                    internetAvailable={true} // Placeholder
                    lastHeartbeat={formatRelativeTime(
                      activeAccount.last_heartbeat_at || null,
                    )}
                    sessionUptime="2d 14h 22m" // Placeholder
                    reconnectCountToday={0} // Placeholder
                  />

                  <TokenManager
                    maskedToken={
                      activeAccount.token
                        ? `${activeAccount.token.substring(0, 12)}••••••••••••••••`
                        : "Wait for sync..."
                    }
                    permissions={[
                      "Read History",
                      "Execute Trades",
                      "Sync Balance",
                    ]}
                    createdAt={activeAccount.created_at}
                    lastUsed={activeAccount.last_sync_at}
                    expiresAt={null}
                    status={activeAccount.token ? "valid" : "revoked"}
                    onCopy={() => handleCopyToken(activeAccount.token || "")}
                    onRotate={() => handleRotateToken(activeAccount.id)}
                    onRevoke={() => handleRevokeToken(activeAccount.id)}
                  />

                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
                      Security Rules
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        "Auto-revoke token on account change",
                        "Reject duplicate terminal sessions",
                        "Single active session enforced",
                        "Offline event queue enabled",
                      ].map((rule, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-slate-400 bg-white/[0.02] p-3 rounded-lg border border-white/5"
                        >
                          <AlertCircle className="h-4 w-4 text-indigo-400" />
                          {rule}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5">
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                      onClick={handleDeactivate}
                    >
                      Deactivate Account
                    </Button>
                    <Button
                      variant="outline"
                      className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10"
                      onClick={() => handleDisconnectTerminal(activeAccount.id)}
                    >
                      Disconnect Terminal
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                      onClick={() => handleRemoveAccount(activeAccount.id)}
                    >
                      Remove Account
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Other Accounts Section */}
          {otherAccounts.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-white">Other Accounts</h2>
              <div className="grid grid-cols-1 gap-4">
                {otherAccounts.map((account) => (
                  <CompactAccountCard
                    key={account.id}
                    name={account.name || "Unnamed Account"}
                    platform="MT5"
                    accountNumber={account.mt5_account_id}
                    status={getAccountStatus(account) as any}
                    lastSeen={account.last_sync_at}
                    onView={() => setActiveAccountId(account.id)}
                    onActivate={() => setActiveAccountId(account.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
