"use client";

import { useState, useEffect, useMemo } from "react";
import { getStats } from "@/lib/api";
import { RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/context/account-context";
import HeadlineCard from "@/components/analytics/HeadlineCard";
import DetailModal from "@/components/analytics/DetailModal";

const DASHBOARD_CONFIG = {
  dashboard: {
    id: "trade_mirror_analytics",
    title: "Analytics",
    description:
      "Comprehensive performance, risk, and execution analytics for mirrored trading strategies",
    layout: {
      type: "grid",
      columns: 12,
      gap: "16px",
    },
    headlineGrid: [
      {
        id: "performance_overview",
        title: "Performance",
        icon: "trending_up",
        grid: { colSpan: 4, rowSpan: 2 },
        summaryCards: [
          {
            label: "Net Return",
            intent: "Shows overall profitability over selected period",
          },
          {
            label: "Equity Curve",
            intent: "Visual representation of account growth",
          },
          {
            label: "Avg Monthly Return",
            intent: "Measures consistency of growth",
          },
        ],
        onClick: {
          action: "open_modal",
          modalId: "performance_modal",
        },
      },
      {
        id: "risk_drawdown",
        title: "Risk & Drawdown",
        icon: "shield",
        grid: { colSpan: 4, rowSpan: 2 },
        summaryCards: [
          {
            label: "Max Drawdown",
            intent: "Worst peak-to-trough equity decline",
          },
          {
            label: "Recovery Factor",
            intent: "Ability to recover from drawdowns",
          },
          { label: "Risk Ratios", intent: "Return adjusted for risk exposure" },
        ],
        onClick: {
          action: "open_modal",
          modalId: "risk_modal",
        },
      },
      {
        id: "trade_quality",
        title: "Trade Quality",
        icon: "check_circle",
        grid: { colSpan: 4, rowSpan: 2 },
        summaryCards: [
          { label: "Win Rate", intent: "Percentage of profitable trades" },
          { label: "Expectancy (R)", intent: "Average R outcome per trade" },
          {
            label: "Profit Factor",
            intent: "Gross win vs gross loss efficiency",
          },
        ],
        onClick: {
          action: "open_modal",
          modalId: "trade_quality_modal",
        },
      },
      {
        id: "trade_management",
        title: "Trade Management",
        icon: "tune",
        grid: { colSpan: 6, rowSpan: 2 },
        summaryCards: [
          { label: "Avg Trade Duration", intent: "How long trades are held" },
          { label: "Break-Even Usage", intent: "Risk reduction behavior" },
          { label: "Partial Close Rate", intent: "Active position management" },
        ],
        onClick: {
          action: "open_modal",
          modalId: "management_modal",
        },
      },
      {
        id: "strategy_behavior",
        title: "Strategy Behavior",
        icon: "psychology",
        grid: { colSpan: 6, rowSpan: 2 },
        summaryCards: [
          { label: "Directional Bias", intent: "Long vs short preference" },
          {
            label: "Session Performance",
            intent: "Performance by market session",
          },
          { label: "Instrument Bias", intent: "Symbol concentration risk" },
        ],
        onClick: {
          action: "open_modal",
          modalId: "strategy_modal",
        },
      },      
    ],
    modals: [
      {
        id: "performance_modal",
        layout: {
          type: "fullscreen",
          sections: [
            {
              title: "Returns Overview",
              layout: "cards_grid",
              cards: [
                "Net Profit",
                "Return %",
                "Compounded Growth",
                "Average Period Returns",
              ],
            },
            {
              title: "Equity Visualization",
              layout: "charts_stack",
              charts: ["Equity Curve", "Balance vs Equity", "Cumulative R"],
            },
          ],
        },
      },
      {
        id: "risk_modal",
        layout: {
          type: "fullscreen",
          sections: [
            {
              title: "Drawdown Analysis",
              layout: "charts_grid",
              charts: ["Drawdown Curve", "Drawdown Duration"],
            },
            {
              title: "Risk Ratios",
              layout: "metric_list",
              metrics: [
                "Max Drawdown",
                "Sharpe Ratio",
                "Sortino Ratio",
                "Calmar Ratio",
                "Profit Factor",
              ],
            },
          ],
        },
      },
      {
        id: "trade_quality_modal",
        layout: {
          type: "fullscreen",
          sections: [
            {
              title: "Win / Loss Structure",
              layout: "cards_grid",
              cards: [
                "Win Rate",
                "Loss Rate",
                "Avg Win",
                "Avg Loss",
                "Win/Loss Ratio",
              ],
            },
            {
              title: "R Distribution",
              layout: "charts_stack",
              charts: ["R Histogram", "Expectancy Breakdown"],
            },
          ],
        },
      },
      {
        id: "management_modal",
        layout: {
          type: "fullscreen",
          sections: [
            {
              title: "Trade Lifecycle",
              layout: "cards_grid",
              cards: [
                "Avg Trade Duration",
                "Time in Market",
                "Trades per Period",
              ],
            },
            {
              title: "Management Behavior",
              layout: "charts_grid",
              charts: [
                "Break-Even Usage",
                "Partial Close Frequency",
                "Trailing Stop Usage",
              ],
            },
          ],
        },
      },
      {
        id: "strategy_modal",
        layout: {
          type: "fullscreen",
          sections: [
            {
              title: "Directional & Instrument Bias",
              layout: "charts_grid",
              charts: ["Long vs Short", "Performance by Symbol"],
            },
            {
              title: "Temporal Performance",
              layout: "charts_grid",
              charts: ["Session Heatmap", "Day of Week Performance"],
            },
          ],
        },
      },
      {
        id: "execution_modal",
        layout: {
          type: "fullscreen",
          sections: [
            {
              title: "Mirror Accuracy",
              layout: "cards_grid",
              cards: ["Execution Delay", "Slippage", "Missed Trades"],
            },
            {
              title: "Copier vs Master",
              layout: "charts_stack",
              charts: ["Equity Overlay", "Return Deviation"],
            },
          ],
        },
      },
      {
        id: "reliability_modal",
        layout: {
          type: "fullscreen",
          sections: [
            {
              title: "System Health",
              layout: "cards_grid",
              cards: ["Uptime", "Offline Events", "Pending Sync Events"],
            },
            {
              title: "Data Integrity",
              layout: "charts_stack",
              charts: ["Reconciliation Errors", "Sync Latency Over Time"],
            },
          ],
        },
      },
      {
        id: "behavioral_modal",
        layout: {
          type: "fullscreen",
          sections: [
            {
              title: "Psychological Patterns",
              layout: "cards_grid",
              cards: ["Risk Creep", "Over-Trading Index", "Discipline Score"],
            },
            {
              title: "Behavior Over Time",
              layout: "charts_stack",
              charts: ["Risk Variance Timeline", "Rule Deviation Events"],
            },
          ],
        },
      },
    ],
  },
};

export default function AnalyticsPage() {
  const { accountId, selectedAccount: account } = useAccount();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const stats = await getStats(accountId || undefined);
      if (stats) setData(stats);
      setLoading(false);
    };
    fetchData();
  }, [accountId, account?.updated_at]);

  const activeModal = useMemo(() => {
    if (!activeModalId) return null;
    return DASHBOARD_CONFIG.dashboard.modals.find(
      (m) => m.id === activeModalId,
    );
  }, [activeModalId]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight italic text-white">
            {DASHBOARD_CONFIG.dashboard.title}
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.34em] mt-1">
            {DASHBOARD_CONFIG.dashboard.description} • {account?.name || "DEMO"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.reload()}
            className="h-10 w-10 bg-white/5 border-white/5 hover:bg-white/10 hover:text-white text-muted-foreground rounded-xl"
          >
            <RefreshCw className="h-4 w-4 hover:rotate-180 transition-transform duration-500" />
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5 auto-rows-fr">
        {DASHBOARD_CONFIG.dashboard.headlineGrid.map((item) => (
          <HeadlineCard
            key={item.id}
            {...item}
            onClick={() => setActiveModalId(item.onClick.modalId)}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {activeModal && (
        <DetailModal
          isOpen={!!activeModalId}
          onClose={() => setActiveModalId(null)}
          title={
            DASHBOARD_CONFIG.dashboard.headlineGrid.find(
              (h) => h.onClick.modalId === activeModalId,
            )?.title || "Details"
          }
          sections={activeModal.layout.sections}
          data={data}
        />
      )}
    </div>
  );
}
