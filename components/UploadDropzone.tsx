"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useClutchStore } from "@/lib/store";
import { compressImage } from "@/lib/imageCompressor";
import { extractVideoKeyframes } from "@/lib/videoFrameExtractor";
import {
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Sparkles,
  Loader2,
  FileCheck,
  Film,
} from "lucide-react";

export const UploadDropzone: React.FC = () => {
  const {
    uploadedImages,
    isVideoSource,
    videoDuration,
    isProcessingMedia,
    mediaStatusMessage,
    addImages,
    removeImage,
    clearImages,
    setProcessingMedia,
    setError,
  } = useClutchStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0]; // Process main dropped file
      const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".mov");

      if (isVideo) {
        setProcessingMedia(true, "Extracting latest chat frames from video...");
        try {
          const result = await extractVideoKeyframes(file, 3, 1080, 0.85);
          addImages(result.frames, true, result.duration);
          setProcessingMedia(false);
        } catch (err: any) {
          console.error("Video keyframe extraction failed:", err);
          setError(
            "Failed to extract video frames. Try uploading a screenshot or shorter clip: " +
              (err?.message || "")
          );
          setProcessingMedia(false);
        }
      } else {
        // Image files
        setProcessingMedia(true, "Downscaling to 1080p WebP...");
        try {
          const processedList = [];
          for (const f of acceptedFiles.slice(0, 3)) {
            if (f.type.startsWith("image/")) {
              const compressed = await compressImage(f, 1080, 0.85);
              processedList.push(compressed);
            }
          }
          addImages(processedList, false);
          setProcessingMedia(false);
        } catch (err: any) {
          console.error("Image compression failed:", err);
          setError("Failed to compress image: " + (err?.message || ""));
          setProcessingMedia(false);
        }
      }
    },
    [addImages, setProcessingMedia, setError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "video/*": [".mp4", ".mov"],
    },
    maxFiles: 3,
    disabled: isProcessingMedia,
  });

  return (
    <div className="w-full space-y-3">
      {uploadedImages.length === 0 ? (
        <div
          {...getRootProps()}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] overflow-hidden ${
            isDragActive
              ? "border-violet-400 bg-violet-950/30 scale-[0.99] shadow-[0_0_30px_rgba(139,92,246,0.3)]"
              : "border-white/[0.12] bg-neutral-900/40 hover:border-violet-500/50 hover:bg-neutral-900/70"
          }`}
        >
          <input {...getInputProps()} />

          {/* Background subtle radial glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {isProcessingMedia ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  {mediaStatusMessage || "Processing media..."}
                </p>
                <p className="text-xs text-neutral-400">
                  Client-side canvas compression in progress
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600/20 to-pink-600/20 border border-white/10 flex items-center justify-center text-violet-300 group-hover:scale-110 group-hover:border-violet-400/50 transition-all duration-300 shadow-lg">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-200 group-hover:text-white">
                  {isDragActive
                    ? "Drop screenshot or screen recording here!"
                    : "Drag & drop chat screenshots or screen recording"}
                </p>
                <p className="text-xs text-neutral-400">
                  Supports <span className="text-neutral-300">PNG, JPG, WebP</span> or video recordings (<span className="text-neutral-300">MP4, MOV</span>)
                </p>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Auto 1080p WebP Downscale
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-neutral-300">
                  <Film className="w-3 h-3 text-cyan-400" />
                  Last 25% Video Keyframes
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {isVideoSource ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <VideoIcon className="w-3.5 h-3.5" />
                  Screen Recording ({videoDuration ? `${videoDuration.toFixed(1)}s` : ""}) • 3 Frames Extracted
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-950/50 border border-violet-500/30 text-violet-300 text-xs font-semibold">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {uploadedImages.length} Screenshot{uploadedImages.length > 1 ? "s" : ""} Optimized
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={clearImages}
              className="text-xs text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-white/5"
            >
              <X className="w-3.5 h-3.5" />
              Remove All
            </button>
          </div>

          {/* Thumbnails Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {uploadedImages.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group rounded-xl border border-white/[0.12] bg-neutral-900/60 overflow-hidden backdrop-blur-md flex flex-col"
                >
                  <div className="relative aspect-[9/14] sm:aspect-[9/13] bg-black/40 overflow-hidden flex items-center justify-center">
                    <img
                      src={img.base64}
                      alt={`Chat Preview ${idx + 1}`}
                      className="w-full h-full object-contain p-1.5"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md backdrop-blur-sm"
                      title="Remove frame"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-neutral-300">
                      {isVideoSource ? `Frame ${idx + 1}` : `Page ${idx + 1}`} • {img.width}x{img.height}
                    </span>
                  </div>

                  <div className="p-2.5 text-[11px] text-neutral-400 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
                    <span className="flex items-center gap-1 truncate max-w-[130px]">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {(img.compressedSize / 1024).toFixed(0)} KB WebP
                    </span>
                    {img.reductionPercentage > 0 && (
                      <span className="text-emerald-400 font-medium">
                        -{img.reductionPercentage}% size
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
