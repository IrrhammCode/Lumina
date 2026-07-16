const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const MAX_OUTPUT_CHARS = 420_000;
const MAX_EDGE = 480;

export class PhotoUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoUploadError";
  }
}

export function isCustomPhotoUrl(url?: string): boolean {
  if (!url) return false;
  return url.startsWith("data:") || url.startsWith("blob:");
}

/** Resize + compress a picked image for localStorage-friendly data URLs */
export async function readPhotoFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new PhotoUploadError("Please choose a photo (JPG or PNG).");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new PhotoUploadError("Photo is too large. Try one under 12 MB.");
  }

  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new PhotoUploadError("Could not process photo.");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_OUTPUT_CHARS && quality > 0.42) {
    quality -= 0.07;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  if (dataUrl.length > MAX_OUTPUT_CHARS) {
    throw new PhotoUploadError("Photo is still too large after compression. Try a simpler image.");
  }

  return dataUrl;
}