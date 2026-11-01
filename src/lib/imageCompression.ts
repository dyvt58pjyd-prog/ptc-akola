/**
 * Compresses an image (from a File, Blob, or base64 data URL) client-side using an HTML5 Canvas.
 * Resizes large smartphone/camera photos down to passport size (~600x800) and compresses to JPEG,
 * reducing multi-megabyte photos down to ~30-70 KB without noticeable visual loss for dossiers.
 */
export async function compressImage(
  source: string | File | Blob,
  maxWidth = 600,
  maxHeight = 800,
  quality = 0.75
): Promise<string> {
  // If not in browser (SSR), return as-is if string
  if (typeof window === "undefined" || typeof document === "undefined") {
    return typeof source === "string" ? source : "";
  }

  // Convert File/Blob to Data URL first if needed
  let dataUrl: string;
  if (typeof source === "string") {
    dataUrl = source;
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    });
  }

  // Load into an Image object
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate aspect ratio scaling
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Draw and compress to JPEG
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      // If image loading fails, fall back to original dataUrl
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}

