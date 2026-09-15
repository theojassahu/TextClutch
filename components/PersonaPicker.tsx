"use client";

import React from "react";
import { motion } from "framer-motion";
import { useClutchStore, PersonaType } from "@/lib/store";
import { Flame, Snowflake, Heart, Sparkles, Brain } from "lucide-react";

interface PersonaConfig {
  id: PersonaType;
  label: string;
  sublabel: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  glowColor: string;
  activeBorder: string;
  activeBg: string;
}

const PERSONAS: PersonaConfig[] = [
  {
    id: "rizz",
    label: "Rizz & Charm",
    sublabel: "Smooth & Flirtatious",
    tagline: "High charisma, confident, non-desperate",
    icon: Flame,
    accentColor: "text-rose-400",
    glowColor: "rgba(244, 63, 94, 0.35)",
    activeBorder: "border-rose-500/80 shadow-[0_0_24px_rgba(244,63,94,0.3)]",
    activeBg: "bg-gradient-to-br from-rose-950/40 via-rose-900/20 to-neutral-900/60",
  },
  {
    id: "cold",
    label: "Cold & Savage",
    sublabel: "Unbothered & Sharp",
    tagline: "Dry, aloof, witty comeback, unaffected",
    icon: Snowflake,
    accentColor: "text-cyan-400",
    glowColor: "rgba(6, 182, 212, 0.35)",
    activeBorder: "border-cyan-400/80 shadow-[0_0_24px_rgba(6,182,212,0.3)]",
    activeBg: "bg-gradient-to-br from-cyan-950/40 via-cyan-900/20 to-neutral-900/60",
  },
  {
    id: "caring",
    label: "Caring & Wholesome",
    sublabel: "Empathetic & Genuine",
    tagline: "Emotionally mature, warm, reassuring",
    icon: Heart,
    accentColor: "text-emerald-400",
    glowColor: "rgba(52, 211, 153, 0.35)",
    activeBorder: "border-emerald-400/80 shadow-[0_0_24px_rgba(52,211,153,0.3)]",
    activeBg: "bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-neutral-900/60",
  },
  {
    id: "playful",
    label: "Playful Banter",
    sublabel: "Teasing & Sarcastic",
    tagline: "Lighthearted, push-pull banter, witty hooks",
    icon: Sparkles,
    accentColor: "text-fuchsia-400",
    glowColor: "rgba(217, 70, 239, 0.35)",
    activeBorder: "border-fuchsia-400/80 shadow-[0_0_24px_rgba(217,70,239,0.3)]",
    activeBg: "bg-gradient-to-br from-fuchsia-950/40 via-fuchsia-900/20 to-neutral-900/60",
  },
  {
    id: "tactical",
    label: "Tactical / Strategic",
    sublabel: "Subtle Frame Control",
    tagline: "Low investment, intrigue-building, poker-faced",
    icon: Brain,
    accentColor: "text-indigo-400",
    glowColor: "rgba(129, 140, 248, 0.35)",
    activeBorder: "border-indigo-400/80 shadow-[0_0_24px_rgba(129,140,248,0.3)]",
    activeBg: "bg-gradient-to-br from-indigo-950/40 via-indigo-900/20 to-neutral-900/60",
  },
];

export const PersonaPicker: React.FC = () => {
  const { selectedPersona, setPersona } = useClutchStore();

  return (
    <div className="w-full space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
          Select Persona / Tone
        </label>
        <span className="text-[11px] text-neutral-500 font-medium">3 AI variants tailored per tone</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {PERSONAS.map((p) => {
          const Icon = p.icon;
          const isActive = selectedPersona === p.id;

          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setPersona(p.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative group text-left p-3 rounded-xl transition-all duration-300 border flex flex-col justify-between overflow-hidden cursor-pointer ${
                isActive
                  ? `${p.activeBorder} ${p.activeBg}`
                  : "border-white/[0.08] bg-neutral-900/50 hover:bg-neutral-800/60 hover:border-white/20"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activePersonaGlow"
                  className="absolute inset-0 bg-gradient-to-r from-white/[0.06] to-transparent pointer-events-none"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-white/15 backdrop-blur-sm"
                      : "bg-white/5 group-hover:bg-white/10"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? p.accentColor : "text-neutral-400"}`} />
                </div>
                {isActive && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current text-white"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                )}
              </div>

              <div>
                <h4
                  className={`text-sm font-semibold tracking-tight leading-snug ${
                    isActive ? "text-white" : "text-neutral-300 group-hover:text-white"
                  }`}
                >
                  {p.label}
                </h4>
                <p className="text-[11px] text-neutral-400 font-normal leading-tight mt-0.5 line-clamp-1">
                  {p.sublabel}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
