"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClutchStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/firebase";
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { isAuthModalOpen, setAuthModalOpen, setUser } = useClutchStore();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      setUser(user);
      setAuthModalOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in window was closed.");
      } else if (err?.code === "auth/popup-blocked") {
        setErrorMsg("Popup was blocked by your browser. Please allow popups for this site.");
      } else if (err?.code === "auth/operation-not-allowed") {
        setErrorMsg("Google provider is not enabled yet in Firebase Console -> Authentication -> Sign-in method.");
      } else if (err?.message?.includes("apiKey") || err?.code === "auth/invalid-api-key") {
        setErrorMsg("Firebase API key not configured yet. Add your Firebase keys to .env.local.");
      } else {
        setErrorMsg(err?.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#0c0e17] p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden text-center"
        >
          {/* Ambient inner gradient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-600/25 blur-[60px] pointer-events-none rounded-full" />

          {/* Close button */}
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="space-y-3 pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-xl shadow-violet-500/30">
              <Sparkles className="w-7 h-7" />
            </div>

            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Unlock Unlimited Clutch Replies
            </h3>

            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Sign in with Google to get unlimited AI comebacks, Hinglish banter, and photo/video screenshot analysis.
            </p>
          </div>

          {/* Perks list */}
          <div className="space-y-2 py-1 text-left bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlimited AI comebacks & screenshot scans</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All 5 Personas: Rizz, Cold, Playful, Caring, Tactical</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Powered by Gemini 3.8 Flash real-time vision</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm transition-all duration-200 shadow-xl shadow-white/10 hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-neutral-700">
                <span className="w-4 h-4 border-2 border-neutral-400 border-t-neutral-900 rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Security footnote */}
          <div className="pt-1 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>1-Click Secure Google Sign-In • No Password Required</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
