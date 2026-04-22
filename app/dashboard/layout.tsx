"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Suspense, useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Bell,
  RefreshCw,
  Calendar,
  ChevronRight,
  Home,
  LogOut,
} from "lucide-react";
import { supabase, signOut } from "@/lib/supabase";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { AccountProvider, useAccount } from "@/context/account-context";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  discord_username: string | null;
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const accountId = searchParams.get("accountId");

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
    };

    fetchProfile();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return [];

    return parts.map((part: string, index: number) => {
      const href = `/${parts.slice(0, index + 1).join("/")}${accountId ? `?accountId=${accountId}` : ""}`;
      const label = part.charAt(0).toUpperCase() + part.slice(1);
      return { label, href, isLast: index === parts.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <AccountProvider>
        <SidebarProvider className="w-full">
          <DashboardContent
            profile={profile}
            breadcrumbs={breadcrumbs}
            handleLogout={handleLogout}
          >
            {children}
          </DashboardContent>
        </SidebarProvider>
      </AccountProvider>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex min-h-screen w-full bg-[#02040a] text-foreground font-sans">
      <Suspense
        fallback={
          <div className="flex h-screen w-full items-center justify-center bg-[#02040a]">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        }
      >
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </Suspense>
      <Toaster />
    </div>
  );
}

function DashboardContent({
  profile,
  breadcrumbs,
  handleLogout,
  children,
}: {
  profile: UserProfile | null;
  breadcrumbs: any[];
  handleLogout: () => void;
  children: React.ReactNode;
}) {
  const { selectedAccount } = useAccount();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <AppSidebar user={profile} />
      <SidebarInset className="bg-[#02040a]">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-grid pointer-events-none opacity-20 z-0"></div>

        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/5 px-6 z-20 glass sticky top-0 backdrop-blur-xl transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-slate-400 hover:text-white" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 bg-white/10"
            />
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-white tracking-wide">
                {selectedAccount ? selectedAccount.name : "Market Overview"}
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
                  {selectedAccount
                    ? `${selectedAccount.broker} • ${selectedAccount.mt5_account_id}`
                    : "Global View • All Terminals"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {profile?.avatar_url && (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-blue-500/30"
              />
            )}

            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-white/10 transition-all group">
                <Bell className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
              <button className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:border-white/10 transition-all group">
                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:border-rose-500/30 transition-all group"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col gap-4 p-4 pt-0 z-10 relative overflow-y-auto">
          <div className="flex-1 p-6 lg:p-8">
            {children}

            {/* Footer */}
            <footer className="mt-12 border-t border-white/5 pt-8 pb-12 flex flex-col md:flex-row justify-between items-center gap-6 opacity-50 hover:opacity-100 transition-opacity">
              <div className="flex flex-col items-center md:items-start gap-1">
                {profile && (
                  <>
                    <p className="text-sm font-semibold text-slate-300 mb-1">
                      {profile.discord_username || profile.full_name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      {profile.email}
                    </p>
                  </>
                )}
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                  TradeMirror Terminal Engine v2.0
                </p>
                <p className="text-[10px] text-slate-500">
                  Institutional grade execution & analytics
                </p>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  API Online
                </span>
                <span>UTC {currentTime}</span>
              </div>
            </footer>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
