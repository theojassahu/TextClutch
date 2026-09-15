export interface CompressedImageResult {
  file: File;
  base64: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  reductionPercentage: number;
}

/**
 * Compresses and downscales chat screenshot client-side to max 1080p in WebP format.
 * Ensures ultra-low upload latency while preserving text clarity.
 */
export async function compressImage(
  file: File,
  maxDimension = 1080,
  quality = 0.85
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Downscale while preserving aspect ratio if larger than maxDimension
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
          reject(new Error("Unable to create canvas rendering context"));
          return;
        }

        // Apply slight image smoothing for text readability
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas blob conversion failed"));
              return;
            }

            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const compressedFile = new File([blob], `${baseName}.webp`, {
              type: "image/webp",
              lastModified: Date.now(),
            });

            const base64Url = canvas.toDataURL("image/webp", quality);
            const originalSize = file.size;
            const compressedSize = blob.size;
            const reductionPercentage = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            resolve({
              file: compressedFile,
              base64: base64Url,
              originalSize,
              compressedSize,
              width,
              height,
              reductionPercentage,
            });
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image file into browser"));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read image file"));
    };

    reader.readAsDataURL(file);
  });
}
