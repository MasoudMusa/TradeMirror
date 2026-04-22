"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardsGrid, ChartsContainer, MetricList } from "./SectionRenderers";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Section {
  title: string;
  layout: string;
  cards?: string[];
  charts?: string[];
  metrics?: string[];
}

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sections: Section[];
  data: any;
}

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  title,
  sections,
  data,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] bg-[#020617]/95 backdrop-blur-3xl border-white/5 p-0 overflow-hidden text-white flex flex-col">
        <DialogHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between shrink-0">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold italic tracking-tight">
              {title}
            </DialogTitle>
            <div className="h-0.5 w-12 bg-emerald-500 rounded-full" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-white/10 text-white/50 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <ScrollArea className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-12 pb-12">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">
                    {section.title}
                  </h4>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {section.layout === "cards_grid" && (
                  <CardsGrid cards={section.cards || []} data={data} />
                )}
                {section.layout === "charts_grid" && (
                  <ChartsContainer
                    charts={section.charts || []}
                    layout="grid"
                    data={data}
                  />
                )}
                {section.layout === "charts_stack" && (
                  <ChartsContainer
                    charts={section.charts || []}
                    layout="stack"
                    data={data}
                  />
                )}
                {section.layout === "metric_list" && (
                  <MetricList metrics={section.metrics || []} data={data} />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default DetailModal;
