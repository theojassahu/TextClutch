import { CompressedImageResult } from "./imageCompressor";

export interface VideoKeyframeResult {
  frames: CompressedImageResult[];
  duration: number;
  extractedTimestamps: number[];
}

/**
 * Extracts up to 3 static keyframes from the last 25% of a video (screen recording) duration.
 * Latest messages in chat recordings are typically at the end.
 * Frames are downscaled and compressed to max 1080p WebP.
 */
export async function extractVideoKeyframes(
  videoFile: File,
  maxFrames = 3,
  maxDimension = 1080,
  quality = 0.85
): Promise<VideoKeyframeResult> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const videoUrl = URL.createObjectURL(videoFile);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;

    video.onloadedmetadata = async () => {
      const duration = video.duration;

      if (!duration || isNaN(duration) || duration <= 0) {
        URL.revokeObjectURL(videoUrl);
        reject(new Error("Unable to determine video duration"));
        return;
      }

      // Calculate timestamps targeting the last 25% of the video duration
      // e.g., for duration 10s: last 25% starts at 7.5s. We pick ~7.8s, ~8.8s, ~9.8s
      const lastQuarterStart = duration * 0.75;
      const remainingRange = duration - lastQuarterStart;
      const step = remainingRange / (maxFrames + 1);

      const timestamps: number[] = [];
      for (let i = 1; i <= maxFrames; i++) {
        const time = Math.min(duration - 0.05, lastQuarterStart + step * i);
        timestamps.push(parseFloat(time.toFixed(2)));
      }

      const extractedFrames: CompressedImageResult[] = [];

      try {
        for (let i = 0; i < timestamps.length; i++) {
          const targetTime = timestamps[i];
          const frame = await captureFrameAtTime(
            video,
            targetTime,
            `${videoFile.name}_frame_${i + 1}`,
            maxDimension,
            quality
          );
          extractedFrames.push(frame);
        }

        URL.revokeObjectURL(videoUrl);
        resolve({
          frames: extractedFrames,
          duration,
          extractedTimestamps: timestamps,
        });
      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error("Failed to load video file"));
    };
  });
}

function captureFrameAtTime(
  video: HTMLVideoElement,
  timestamp: number,
  frameName: string,
  maxDimension: number,
  quality: number
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);

      try {
        let width = video.videoWidth || 1080;
        let height = video.videoHeight || 1920;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context creation failed"));
          return;
        }

        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Video frame toBlob conversion failed"));
              return;
            }

            const frameFile = new File([blob], `${frameName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const base64 = canvas.toDataURL("image/webp", quality);

            resolve({
              file: frameFile,
              base64,
              originalSize: blob.size,
              compressedSize: blob.size,
              width,
              height,
              reductionPercentage: 0,
            });
          },
          "image/webp",
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = timestamp;
  });
}
