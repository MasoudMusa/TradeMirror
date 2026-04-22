"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

// --- Metric List ---
export const MetricList = ({
  metrics,
  data,
}: {
  metrics: string[];
  data: any;
}) => {
  const stats = data?.stats || {};

  const getValue = (label: string) => {
    switch (label) {
      case "Max Drawdown":
        return stats.maxDrawdown || "N/A";
      case "Sharpe Ratio":
        return stats.sharpeRatio || "N/A";
      case "Sortino Ratio":
        return stats.sortinoRatio || "N/A";
      case "Calmar Ratio":
        return stats.calmarRatio || "N/A";
      case "Profit Factor":
        return stats.profitFactor || "0.00";
      default:
        return "---";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-lg hover:border-white/10 transition-colors"
        >
          <span className="text-sm text-white/60">{metric}</span>
          <span className="text-sm font-bold text-white">
            {getValue(metric)}
          </span>
        </div>
      ))}
    </div>
  );
};

// --- Cards Grid ---
export const CardsGrid = ({ cards, data }: { cards: string[]; data: any }) => {
  const stats = data?.stats || {};

  const getValue = (label: string) => {
    switch (label) {
      case "Net Profit":
        return `$${(stats.totalProfit || 0).toLocaleString()}`;
      case "Return %":
        return `${stats.returnPercentage || "0.00"}%`;
      case "Compounded Growth":
        return `${stats.cagr || "0.00"}%`;
      case "Average Period Returns":
        return `${stats.avgDailyReturn || "0.00"}%`;
      case "Win Rate":
        return `${stats.winRate || 0}%`;
      case "Loss Rate":
        return `${100 - (stats.winRate || 0)}%`;
      case "Avg Win":
        return `$${stats.avgWin || 0}`;
      case "Avg Loss":
        return `$${stats.avgLoss || 0}`;
      case "Win/Loss Ratio":
        return (stats.avgWin / (stats.avgLoss || 1)).toFixed(2);
      default:
        return "---";
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className="bg-white/5 border-white/10 shadow-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
        >
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">
              {card}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-center">
            <div className="text-xl font-bold text-emerald-400">
              {getValue(card)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// --- Charts Container ---
export const ChartsContainer = ({
  charts,
  layout,
  data,
}: {
  charts: string[];
  layout: "grid" | "stack";
  data: any;
}) => {
  const equityCurve = data?.equityCurve || [];

  return (
    <div
      className={
        layout === "grid"
          ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
          : "space-y-6"
      }
    >
      {charts.map((chart, idx) => (
        <Card
          key={idx}
          className="bg-[#0B1120]/60 border-white/5 shadow-xl h-96 group relative overflow-hidden"
        >
          <CardHeader className="p-6 border-b border-white/5">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">
              {chart}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 p-6 pt-8">
            {chart === "Equity Curve" && equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={equityCurve}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id={`grad-equity-${idx}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff05"
                    vertical={false}
                  />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis
                    domain={["dataMin", "auto"]}
                    stroke="#ffffff20"
                    fontSize={10}
                    tickFormatter={(v) => `$${v.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B1120",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#10b981", fontWeight: "bold" }}
                    labelFormatter={(label) =>
                      format(new Date(label), "MMM dd, HH:mm")
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill={`url(#grad-equity-${idx})`}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : chart === "Cumulative R" && data?.rrCurve?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.rrCurve}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id={`grad-r-${idx}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff05"
                    vertical={false}
                  />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis
                    stroke="#ffffff20"
                    fontSize={10}
                    tickFormatter={(v) => `${v}R`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0B1120",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#6366f1", fontWeight: "bold" }}
                    labelFormatter={(label) =>
                      format(new Date(label), "MMM dd, HH:mm")
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="rMultiple"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill={`url(#grad-r-${idx})`}
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <div className="h-24 w-24 rounded-full border-4 border-dashed border-white/5 flex items-center justify-center animate-pulse">
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-20">
                    No Data
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">
                  Visualizing {chart}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
