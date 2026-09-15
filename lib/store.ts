import { create } from "zustand";
import { CompressedImageResult } from "./imageCompressor";
import { SampleChat } from "./sampleChats";
import type { User } from "firebase/auth";

export type PersonaType = "rizz" | "cold" | "caring" | "playful" | "tactical";
export type LanguageType = "auto" | "english" | "hinglish" | "hindi";

export interface ReplyOption {
  tag: string;
  text: string;
}

export interface GenerationResult {
  detected_context: string;
  detected_language: string;
  replies: ReplyOption[];
}

interface ClutchState {
  inputMode: "screenshot" | "text";
  rawText: string;
  extraContext: string;
  uploadedImages: CompressedImageResult[];
  isVideoSource: boolean;
  videoDuration: number | null;
  videoFramesCount: number;
  isProcessingMedia: boolean;
  mediaStatusMessage: string;

  selectedPersona: PersonaType;
  selectedLanguage: LanguageType;

  isGenerating: boolean;
  error: string | null;
  results: GenerationResult | null;
  copiedIndex: number | null;

  // Firebase Auth & Paywall State
  user: User | null;
  isAuthModalOpen: boolean;
  guestGenerationsCount: number;
  hasPendingGeneration: boolean;

  // Actions
  setInputMode: (mode: "screenshot" | "text") => void;
  setRawText: (text: string) => void;
  setExtraContext: (ctx: string) => void;
  setPersona: (persona: PersonaType) => void;
  setLanguage: (lang: LanguageType) => void;
  addImages: (images: CompressedImageResult[], isVideo?: boolean, duration?: number) => void;
  removeImage: (index: number) => void;
  clearImages: () => void;
  setProcessingMedia: (loading: boolean, msg?: string) => void;
  setGenerating: (generating: boolean) => void;
  setError: (err: string | null) => void;
  setResults: (res: GenerationResult | null) => void;
  setCopiedIndex: (index: number | null) => void;
  loadSampleChat: (sample: SampleChat) => void;
  resetAll: () => void;

  // Auth actions
  setUser: (u: User | null) => void;
  setAuthModalOpen: (open: boolean) => void;
  setGuestGenerationsCount: (count: number) => void;
  incrementGuestGenerations: () => void;
  setHasPendingGeneration: (pending: boolean) => void;
}

export const useClutchStore = create<ClutchState>((set) => ({
  inputMode: "screenshot",
  rawText: "",
  extraContext: "",
  uploadedImages: [],
  isVideoSource: false,
  videoDuration: null,
  videoFramesCount: 0,
  isProcessingMedia: false,
  mediaStatusMessage: "",

  selectedPersona: "rizz",
  selectedLanguage: "auto",

  isGenerating: false,
  error: null,
  results: null,
  copiedIndex: null,

  // Initial Auth & Paywall State
  user: null,
  isAuthModalOpen: false,
  guestGenerationsCount: 0,
  hasPendingGeneration: false,

  setInputMode: (mode) => set({ inputMode: mode, error: null }),
  setRawText: (text) => set({ rawText: text }),
  setExtraContext: (ctx) => set({ extraContext: ctx }),
  setPersona: (persona) => set({ selectedPersona: persona }),
  setLanguage: (lang) => set({ selectedLanguage: lang }),

  addImages: (images, isVideo = false, duration) =>
    set((state) => ({
      uploadedImages: isVideo ? images : [...state.uploadedImages, ...images].slice(0, 5),
      isVideoSource: isVideo,
      videoDuration: duration ?? null,
      videoFramesCount: isVideo ? images.length : 0,
      error: null,
    })),

  removeImage: (index) =>
    set((state) => {
      const updated = [...state.uploadedImages];
      updated.splice(index, 1);
      return {
        uploadedImages: updated,
        isVideoSource: updated.length === 0 ? false : state.isVideoSource,
        videoFramesCount: updated.length === 0 ? 0 : state.videoFramesCount,
      };
    }),

  clearImages: () =>
    set({
      uploadedImages: [],
      isVideoSource: false,
      videoDuration: null,
      videoFramesCount: 0,
    }),

  setProcessingMedia: (loading, msg = "") =>
    set({ isProcessingMedia: loading, mediaStatusMessage: msg }),

  setGenerating: (generating) => set({ isGenerating: generating, error: null }),
  setError: (err) => set({ error: err, isGenerating: false }),
  setResults: (res) => set({ results: res, isGenerating: false, error: null }),
  setCopiedIndex: (index) => set({ copiedIndex: index }),

  loadSampleChat: (sample) =>
    set({
      inputMode: "text",
      rawText: sample.text,
      extraContext: sample.extraContext,
      selectedPersona: sample.recommendedPersona,
      selectedLanguage: sample.recommendedLanguage,
      error: null,
      results: null,
    }),

  resetAll: () =>
    set({
      rawText: "",
      extraContext: "",
      uploadedImages: [],
      isVideoSource: false,
      videoDuration: null,
      videoFramesCount: 0,
      results: null,
      error: null,
      copiedIndex: null,
      hasPendingGeneration: false,
    }),

  setUser: (u) => set({ user: u }),
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setGuestGenerationsCount: (count) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("textclutch_free_generations", count.toString());
      } catch {
        // ignore storage write error
      }
    }
    set({ guestGenerationsCount: count });
  },
  incrementGuestGenerations: () =>
    set((state) => {
      const newCount = state.guestGenerationsCount + 1;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("textclutch_free_generations", newCount.toString());
        } catch {
          // ignore
        }
      }
      return { guestGenerationsCount: newCount };
    }),
  setHasPendingGeneration: (pending) => set({ hasPendingGeneration: pending }),
}));
