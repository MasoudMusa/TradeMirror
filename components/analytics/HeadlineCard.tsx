"use client";

import React from "react";
import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCard {
  label: string;
  intent: string;
}

interface HeadlineCardProps {
  id: string;
  title: string;
  icon: string;
  summaryCards: SummaryCard[];
  grid: { colSpan: number; rowSpan: number };
  onClick: () => void;
}

const HeadlineCard: React.FC<HeadlineCardProps> = ({
  title,
  icon,
  summaryCards,
  grid,
  onClick,
}) => {
  // Map icon string to Lucide component
  const formatIconName = (name: string) => {
    return name
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  };

  const IconComponent = (Icons as any)[formatIconName(icon)] || Icons.Activity;

  // Grid span mapping for Tailwind JIT
  const mdColSpans: Record<number, string> = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
    7: "md:col-span-7",
    8: "md:col-span-8",
    9: "md:col-span-9",
    10: "md:col-span-10",
    11: "md:col-span-11",
    12: "md:col-span-12",
  };
  const mdRowSpans: Record<number, string> = {
    1: "md:row-span-1",
    2: "md:row-span-2",
    3: "md:row-span-3",
    4: "md:row-span-4",
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden bg-[#0B1120]/40 backdrop-blur-xl border-white/5 shadow-2xl transition-all duration-500 cursor-pointer",
        "hover:border-white/20 hover:bg-[#0B1120]/60 hover:-translate-y-1 hover:shadow-emerald-500/10",
        "col-span-12", // Default for mobile
        mdColSpans[grid.colSpan] || "md:col-span-1",
        mdRowSpans[grid.rowSpan] || "md:row-span-1",
      )}
    >
      {/* Glow Effect */}
      <div className="absolute -inset-px bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <CardContent className="p-6 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white/80 transition-colors">
              {title}
            </h3>
            <div className="h-0.5 w-8 bg-emerald-500/50 rounded-full group-hover:w-12 transition-all duration-500" />
          </div>
          <div className="p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/5 transition-all duration-500">
            <IconComponent className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {summaryCards.map((card, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-xs font-medium text-white/90">
                {card.label}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                {card.intent}
              </span>
            </div>
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <IconComponent className="h-24 w-24 -mr-8 -mb-8 rotate-12" />
        </div>
      </CardContent>
    </Card>
  );
};

export default HeadlineCard;
