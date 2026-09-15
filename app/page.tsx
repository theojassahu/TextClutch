"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClutchStore } from "@/lib/store";
import { auth, onAuthStateChanged, logOut, syncUserProfile } from "@/lib/firebase";
import { SAMPLE_CHATS } from "@/lib/sampleChats";
import { UploadDropzone } from "@/components/UploadDropzone";
import { PersonaPicker } from "@/components/PersonaPicker";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ReplyCard } from "@/components/ReplyCard";
import { ContextBadge } from "@/components/ContextBadge";
import { AuthModal } from "@/components/AuthModal";
import {
  Sparkles,
  Camera,
  MessageSquareText,
  Flame,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  LogIn,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const {
    inputMode,
    setInputMode,
    rawText,
    setRawText,
    extraContext,
    setExtraContext,
    uploadedImages,
    selectedPersona,
    selectedLanguage,
    isGenerating,
    setGenerating,
    results,
    setResults,
    error,
    setError,
    copiedIndex,
    setCopiedIndex,
    loadSampleChat,
    resetAll,
    user,
    setUser,
    isAuthModalOpen,
    setAuthModalOpen,
    guestGenerationsCount,
    setGuestGenerationsCount,
    incrementGuestGenerations,
    hasPendingGeneration,
    setHasPendingGeneration,
  } = useClutchStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExtraContext, setShowExtraContext] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Sync Firebase Auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Initialize guest usage counter from localStorage
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("textclutch_free_generations");
        if (stored) {
          setGuestGenerationsCount(parseInt(stored, 10) || 0);
        }
      } catch {
        // ignore
      }
    }

    return () => unsubscribe();
  }, [setUser, setGuestGenerationsCount]);

  // Loading animation step cycler
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 3);
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast("Copied to clipboard! 📋");
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const executeGeneration = useCallback(async () => {
    // Validate inputs
    if (inputMode === "screenshot" && uploadedImages.length === 0) {
      setError("Please upload a chat screenshot or video screen recording first.");
      return;
    }
    if (inputMode === "text" && !rawText.trim()) {
      setError("Please paste chat text or select a demo sample below.");
      return;
    }

    // Paywall Check: 1 free generation for guests, then mandatory sign-in
    if (!user && guestGenerationsCount >= 1) {
      setHasPendingGeneration(true);
      setAuthModalOpen(true);
      return;
    }

    setGenerating(true);
    setError(null);

    // If guest is generating their 1st reply, increment usage
    if (!user) {
      incrementGuestGenerations();
    } else {
      // Sync generation counter in Firestore
      syncUserProfile(user, true);
    }

    try {
      const response = await fetch("/api/generate-reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          persona: selectedPersona,
          language: selectedLanguage,
          text: inputMode === "text" ? rawText : "",
          extraContext: extraContext.trim(),
          images:
            inputMode === "screenshot"
              ? uploadedImages.map((img) => ({
                  mimeType: "image/webp",
                  base64: img.base64,
                }))
              : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation request failed");
      }

      setResults(data);
      setHasPendingGeneration(false);

      // Scroll smoothly to results
      setTimeout(() => {
        const resultsEl = document.getElementById("results-deck");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err: any) {
      console.error("Reply generation error:", err);
      setError(err?.message || "Failed to generate replies. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [
    inputMode,
    uploadedImages,
    rawText,
    user,
    guestGenerationsCount,
    selectedPersona,
    selectedLanguage,
    extraContext,
    setHasPendingGeneration,
    setAuthModalOpen,
    setGenerating,
    setError,
    incrementGuestGenerations,
    setResults,
  ]);

  // Handle auto-executing pending generation once user signs in
  useEffect(() => {
    if (user && hasPendingGeneration && !isGenerating) {
      executeGeneration();
    }
  }, [user, hasPendingGeneration, isGenerating, executeGeneration]);

  const loadingSteps = [
    "Analyzing message subtext & tone...",
    `Calibrating ${selectedPersona.toUpperCase()} persona & frame...`,
    "Synthesizing 3 high-impact clutch replies...",
  ];

  return (
    <div className="relative min-h-screen bg-[#07090e] text-neutral-100 flex flex-col items-center">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-tr from-violet-600/15 via-purple-600/15 to-pink-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-[40%] right-[-5%] w-[450px] h-[450px] bg-cyan-600/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-rose-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#07090e]/70 border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
                  TextClutch
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium hidden sm:block">
                AI Conversational Reply Strategist
              </p>
            </div>
          </div>

          {/* User Auth State Profile Badge / Sign In */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2 bg-neutral-900/80 border border-white/[0.1] px-3 py-1.5 rounded-full shadow-inner">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-6 h-6 rounded-full border border-violet-400/50 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-violet-600/40 border border-violet-400/50 flex items-center justify-center text-[10px] font-bold text-violet-200">
                    {user.displayName?.[0] || user.email?.[0] || "U"}
                  </div>
                )}
                <span className="text-xs font-semibold text-neutral-200 max-w-[120px] truncate hidden sm:inline">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Unlimited
                </span>
                <button
                  type="button"
                  onClick={() => logOut()}
                  title="Sign Out"
                  className="p-1 rounded-full text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900/80 border border-white/[0.08] text-[11px] text-neutral-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    {guestGenerationsCount === 0 ? "1 Free Reply Left" : "0 Free Left"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/20 transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-4xl px-4 py-8 flex flex-col gap-6">
        {/* Hero Section */}
        <section className="text-center space-y-3 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-950/70 to-pink-950/70 border border-violet-500/30 text-xs font-medium text-violet-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin-slow" />
            <span>Multimodal Vision • English • Hinglish • Hindi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Never Get Left on{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-fuchsia-400 to-indigo-400">
              Seen Again
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-neutral-400 leading-relaxed font-normal">
            Drop a chat screenshot, screen recording, or paste raw text. Get 3 instant, context-aware comeback replies calibrated for high charisma.
          </p>
        </section>

        {/* Quick Demo Preset Pills */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              Quick 1-Tap Demo Scenarios
            </span>
            <span className="text-[11px] text-neutral-500">Instant test cases</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SAMPLE_CHATS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => loadSampleChat(sample)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-900/80 hover:bg-neutral-800 border border-white/[0.08] hover:border-violet-500/40 text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="text-violet-400">#</span>
                <span>{sample.title}</span>
                <span className="text-[10px] text-neutral-500 px-1 py-0.2 rounded bg-black/40">
                  {sample.category}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Hero Multi-Input Card */}
        <section className="rounded-3xl p-5 sm:p-7 glass-panel shadow-2xl space-y-6">
          {/* Tabs: Media vs Text */}
          <div className="flex p-1 rounded-2xl bg-neutral-950/80 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setInputMode("screenshot")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                inputMode === "screenshot"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Screenshot / Video Clip</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                inputMode === "text"
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Paste Chat Text</span>
            </button>
          </div>

          {/* Active Input Panel */}
          {inputMode === "screenshot" ? (
            <UploadDropzone />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>Chat History / Message Log</span>
                <span>{rawText.length} chars</span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the conversation log here...&#10;e.g.&#10;Them: Arre yaar sorry meeting me tha, free hai kya?&#10;Me: ..."
                rows={5}
                className="w-full rounded-2xl bg-neutral-950/70 border border-white/[0.1] p-4 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 font-sans leading-relaxed transition-all"
              />
            </div>
          )}

          {/* Optional Extra Context Accordion */}
          <div className="rounded-xl border border-white/[0.06] bg-neutral-950/40 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExtraContext(!showExtraContext)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
                <span>Add Extra Unspoken Context (Optional)</span>
                {extraContext.trim() && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </div>
              {showExtraContext ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showExtraContext && (
              <div className="p-4 pt-0">
                <input
                  type="text"
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="e.g. She's a college friend, we went on 1 date, she took 8 hours to reply..."
                  className="w-full rounded-xl bg-neutral-900/90 border border-white/10 px-3.5 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}
          </div>

          {/* Persona Picker */}
          <PersonaPicker />

          {/* Language Preference Selector */}
          <LanguageSelector />

          {/* Error Message Box */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={executeGeneration}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer select-none ${
                isGenerating
                  ? "bg-violet-900/50 text-violet-300 border border-violet-500/30 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 text-white hover:opacity-95 shadow-xl hover:shadow-2xl glow-action-btn"
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-violet-300" />
                  <span className="font-semibold">{loadingSteps[loadingStep]}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>
                    {!user && guestGenerationsCount >= 1
                      ? "Sign Up to Generate Reply"
                      : "Generate Clutch Replies"}
                  </span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Output & Results Deck */}
        <section id="results-deck" className="space-y-4">
          {isGenerating && (
            <div className="rounded-3xl p-6 glass-panel space-y-4 animate-pulse">
              <div className="h-10 bg-white/5 rounded-xl w-3/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-36 bg-white/5 rounded-2xl"></div>
                <div className="h-36 bg-white/5 rounded-2xl"></div>
                <div className="h-36 bg-white/5 rounded-2xl"></div>
              </div>
            </div>
          )}

          {results && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Generated Clutch Options
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={executeGeneration}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-neutral-300 hover:text-white transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Context Breakdown Badge */}
              <ContextBadge
                contextText={results.detected_context}
                languageText={results.detected_language}
              />

              {/* 3 Reply Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {results.replies.map((reply, index) => (
                  <ReplyCard
                    key={index}
                    reply={reply}
                    index={index}
                    isCopied={copiedIndex === index}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="pt-8 pb-12 text-center text-xs text-neutral-500 space-y-2">
          <p>
            TextClutch • Intelligent Social Dynamics Engine
          </p>
          <p className="text-[11px] text-neutral-600">
            Powered by Firebase Authentication & Google Gemini Multimodal Vision across English, Hinglish, and Hindi.
          </p>
        </footer>
      </main>

      {/* Floating Clipboard Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 z-50 px-4 py-2.5 rounded-full bg-emerald-500 text-white font-semibold text-xs shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Firebase Auth Paywall Modal */}
      <AuthModal onSuccess={executeGeneration} />
    </div>
  );
}
