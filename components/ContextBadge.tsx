"use client";

import React from "react";
import { motion } from "framer-motion";
import { Eye, Languages, Sparkles } from "lucide-react";

interface ContextBadgeProps {
  contextText: string;
  languageText: string;
}

export const ContextBadge: React.FC<ContextBadgeProps> = ({
  contextText,
  languageText,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full rounded-xl bg-gradient-to-r from-violet-950/40 via-neutral-900/60 to-indigo-950/40 border border-violet-500/20 p-3.5 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-neutral-300"
    >
      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shrink-0 mt-0.5 sm:mt-0">
          <Eye className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <span className="font-semibold text-white mr-1.5">Context Dynamics:</span>
          <span className="text-neutral-300 font-normal leading-relaxed">
            {contextText}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[11px] font-medium text-neutral-300">
          <Languages className="w-3 h-3 text-violet-400" />
          {languageText}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-400">
          <Sparkles className="w-3 h-3" />
          Clutch Ready
        </span>
      </div>
    </motion.div>
  );
};
