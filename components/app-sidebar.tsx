"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Bell,
  RefreshCw,
  Key,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/supabase";

const navItems = [
  { name: "Accounts", href: "/dashboard/accounts", icon: Wallet },
  { name: "Trades", href: "/dashboard/trades", icon: ListChecks },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  // { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

import { createClient } from "@/lib/supabase/client";
import { CreateAccountModal } from "@/components/create-account-modal";

// Keep interface for local state helper
interface Account {
  id: string;
  name: string;
  desc: string;
  color: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    discord_username?: string | null;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
}

import { useAccount } from "@/context/account-context";

import { useRealtimeAccounts } from "@/hooks/use-realtime-accounts";

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    accountId,
    setAccountId,
    selectedAccount: contextAccount,
  } = useAccount();

  const [userId, setUserId] = React.useState<string | undefined>(undefined);
  const { accounts: rawAccounts, loading } = useRealtimeAccounts(userId);

  // Get userId from auth session
  React.useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const accounts = React.useMemo(() => {
    return rawAccounts.map((acc: any) => ({
      id: acc.id,
      name: acc.name || `Account #${acc.mt5_account_id || "???"}`,
      desc:
        acc.broker ||
        (acc.mt5_account_id ? `MT5: ${acc.mt5_account_id}` : "Not Connected"),
      color: acc.is_active ? "bg-emerald-500" : "bg-gray-400",
    }));
  }, [rawAccounts]);

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const displayName = user?.discord_username || user?.full_name || "User";
  const displayEmail = user?.email || "user@example.com";
  const initials = displayName.substring(0, 2).toUpperCase();

  // Find current account details for display from the list
  const activeAccountDisplay = contextAccount
    ? {
        name:
          contextAccount.name || `Account #${contextAccount.mt5_account_id}`,
        desc: contextAccount.broker || `MT5: ${contextAccount.mt5_account_id}`,
        color: contextAccount.is_active ? "bg-emerald-500" : "bg-gray-400",
      }
    : {
        name: "Global View",
        desc: "All Terminals Connected",
        color: "bg-indigo-500",
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${activeAccountDisplay.color}`}
                  >
                    {!contextAccount && !loading ? (
                      <LayoutDashboard className="h-4 w-4 text-white" />
                    ) : (
                      <Wallet className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-white">
                      {loading ? "Loading..." : activeAccountDisplay.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {loading ? "Fetching..." : activeAccountDisplay.desc}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] bg-[#0B1120] border-white/10 text-white"
                align="start"
              >
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-3 px-4">
                  Portfolio Context
                </DropdownMenuLabel>

                {/* Global View Option */}
                <DropdownMenuItem
                  onClick={() => setAccountId(null)}
                  className="gap-3 p-3 focus:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">All Terminals</span>
                    <span className="text-[10px] text-slate-500">
                      Aggregated Performance
                    </span>
                  </div>
                  {!contextAccount && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/5 mx-2" />

                {accounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => setAccountId(account.id)}
                    className="gap-3 p-3 focus:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center border ${account.color === "bg-emerald-500" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border-white/5 text-slate-500"}`}
                    >
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{account.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                        {account.desc}
                      </span>
                    </div>
                    {contextAccount?.id === account.id && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    )}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className="bg-white/5 mx-2" />

                <CreateAccountModal>
                  <DropdownMenuItem
                    className="gap-3 p-3 focus:bg-white/5 cursor-pointer"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="h-8 w-8 rounded-lg bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-slate-400">
                      <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      Connect New Terminal
                    </span>
                  </DropdownMenuItem>
                </CreateAccountModal>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {displayName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="w-fit text-[10px] font-semibold"
                    >
                      Pro Plan
                    </Badge>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {displayName}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {displayEmail}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
