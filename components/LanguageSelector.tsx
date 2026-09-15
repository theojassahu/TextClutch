"use client";

import React from "react";
import { useClutchStore, LanguageType } from "@/lib/store";
import { Globe, Languages } from "lucide-react";

interface LanguageOption {
  id: LanguageType;
  label: string;
  sub: string;
  flag: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: "auto", label: "Auto-Detect", sub: "Smart Detection", flag: "🌐" },
  { id: "english", label: "English", sub: "Gen-Z / Clean", flag: "🇬🇧" },
  { id: "hinglish", label: "Hinglish", sub: "Latin Hindi-English", flag: "🇮🇳" },
  { id: "hindi", label: "Hindi", sub: "हिंदी Devanagari", flag: "🕉️" },
];

export const LanguageSelector: React.FC = () => {
  const { selectedLanguage, setLanguage } = useClutchStore();

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between px-1">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-violet-400" />
          Language Preference
        </label>
        <span className="text-[11px] text-neutral-500 font-medium">Auto adapts slang & tone</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-900/60 p-1.5 rounded-xl border border-white/[0.08] backdrop-blur-md">
        {LANGUAGES.map((lang) => {
          const isActive = selectedLanguage === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => setLanguage(lang.id)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border border-violet-500/50 text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate leading-tight">
                  {lang.label}
                </span>
                <span className="text-[10px] text-neutral-400 truncate leading-none mt-0.5">
                  {lang.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
