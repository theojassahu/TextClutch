"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClutchStore } from "@/lib/store";
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/firebase";
import {
  X,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface AuthModalProps {
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const { isAuthModalOpen, setAuthModalOpen, setUser } = useClutchStore();

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      // Friendly message if popup closed or Firebase dev mock
      if (err?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in was cancelled.");
      } else if (err?.message?.includes("apiKey") || err?.code === "auth/invalid-api-key") {
        setErrorMsg("Firebase API key not configured yet. Add your Firebase keys to .env.local to enable live authentication.");
      } else {
        setErrorMsg(err?.message || "Failed to sign in with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user =
        mode === "signup"
          ? await signUpWithEmail(email.trim(), password)
          : await signInWithEmail(email.trim(), password);

      setUser(user);
      setAuthModalOpen(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Email Auth error:", err);
      if (err?.code === "auth/user-not-found" || err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setErrorMsg("Invalid email or password.");
      } else if (err?.code === "auth/email-already-in-use") {
        setErrorMsg("Email already in use. Please sign in instead.");
        setMode("signin");
      } else if (err?.code === "auth/weak-password") {
        setErrorMsg("Password should be at least 6 characters.");
      } else if (err?.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (err?.message?.includes("apiKey") || err?.code === "auth/invalid-api-key") {
        setErrorMsg("Firebase API key not configured yet. Add your Firebase keys to .env.local to enable live authentication.");
      } else {
        setErrorMsg(err?.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#0c0e17] p-6 sm:p-8 shadow-2xl space-y-5 overflow-hidden"
        >
          {/* Ambient inner gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-600/20 blur-[60px] pointer-events-none rounded-full" />

          {/* Close button */}
          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 pt-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/30 mb-1">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Unlock Unlimited Clutch Replies
            </h3>

            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              You&apos;ve used your 1 free guest generation. Sign up in seconds to get unlimited AI comebacks, Hinglish banter, and photo/video OCR.
            </p>
          </div>

          {/* Google Sign-in Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/[0.08] w-full" />
            <span className="bg-[#0c0e17] px-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              or with email
            </span>
            <div className="border-t border-white/[0.08] w-full" />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-neutral-900/90 border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl bg-neutral-900/90 border border-white/10 pl-10 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === "signup" ? "Create Free Account" : "Sign In"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setErrorMsg(null);
              }}
              className="text-xs text-neutral-400 hover:text-violet-300 transition-colors cursor-pointer"
            >
              {mode === "signup" ? (
                <>
                  Already have an account? <span className="font-semibold text-violet-400">Sign in</span>
                </>
              ) : (
                <>
                  Need an account? <span className="font-semibold text-violet-400">Sign up free</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure Firebase Authentication • Instant unlock</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
