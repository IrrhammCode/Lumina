const USER_PHOTO_KEY = "lumina_user_photo";

export function getUserPhotoUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = localStorage.getItem(USER_PHOTO_KEY);
  return raw || undefined;
}

export function setUserPhotoUrl(photoUrl: string | undefined): void {
  if (typeof window === "undefined") return;
  if (!photoUrl) {
    localStorage.removeItem(USER_PHOTO_KEY);
    return;
  }
  localStorage.setItem(USER_PHOTO_KEY, photoUrl);
}