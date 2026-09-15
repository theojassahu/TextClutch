"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ReplyOption } from "@/lib/store";
import { Copy, Check, ShieldCheck, Zap, Sparkles, Share2, CornerDownRight } from "lucide-react";
import confetti from "canvas-confetti";

interface ReplyCardProps {
  reply: ReplyOption;
  index: number;
  isCopied: boolean;
  onCopy: (text: string, index: number) => void;
}

const VARIANT_CONFIGS = [
  {
    icon: ShieldCheck,
    title: "Option 1: Safe & Casual",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    glow: "group-hover:border-emerald-500/40 group-hover:shadow-[0_0_25px_rgba(52,211,153,0.15)]",
    vibe: "Low-Risk • Nonchalant",
  },
  {
    icon: Zap,
    title: "Option 2: Direct & High Impact",
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    glow: "group-hover:border-amber-500/40 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]",
    vibe: "Bold • Clear Frame",
  },
  {
    icon: Sparkles,
    title: "Option 3: Wildcard & Tease",
    badgeBg: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    glow: "group-hover:border-purple-500/40 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]",
    vibe: "Intrigue • Hook",
  },
];

export const ReplyCard: React.FC<ReplyCardProps> = ({
  reply,
  index,
  isCopied,
  onCopy,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(reply.text);

  const config = VARIANT_CONFIGS[index % VARIANT_CONFIGS.length];
  const Icon = config.icon;

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(isEditing ? editedText : reply.text, index);

    // Fire subtle celebratory confetti from the button's position
    try {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { x, y },
        colors: ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981"],
        disableForReducedMotion: true,
      });
    } catch {
      // Confetti fallback safely ignored
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      onClick={() => {
        if (!isEditing) onCopy(reply.text, index);
      }}
      className={`group relative rounded-2xl p-5 border border-white/[0.1] bg-neutral-900/60 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${config.glow}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.badgeBg}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {reply.tag || config.title}
          </span>
          <span className="hidden sm:inline-block text-[11px] text-neutral-500 font-medium">
            {config.vibe}
          </span>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopyClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
            isCopied
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              : "bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-neutral-300 hover:text-white"
          }`}
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Reply Text Body */}
      <div className="py-2">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            rows={3}
            className="w-full rounded-xl bg-black/50 border border-violet-500/40 p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
          />
        ) : (
          <p className="text-base text-neutral-100 font-normal leading-relaxed tracking-wide selection:bg-violet-500/40">
            {editedText}
          </p>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-neutral-400">
        <div className="flex items-center gap-2">
          <span>{editedText.length} characters</span>
          <span>•</span>
          <span>{editedText.trim().split(/\s+/).length} words</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="text-neutral-400 hover:text-violet-300 transition-colors"
          >
            {isEditing ? "Done" : "Tweak"}
          </button>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-500 group-hover:text-neutral-300 transition-colors flex items-center gap-1">
            <CornerDownRight className="w-3 h-3" />
            Tap card to copy
          </span>
        </div>
      </div>
    </motion.div>
  );
};
