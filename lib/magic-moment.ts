const PENDING_KEY = "lumina:magic-moment-pending";
const SEEN_KEY = "lumina:magic-moment-seen";

export function markMagicMomentPending(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEEN_KEY)) return;
  sessionStorage.setItem(PENDING_KEY, "1");
}

export function consumeMagicMoment(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(SEEN_KEY)) return false;
  const pending = sessionStorage.getItem(PENDING_KEY);
  if (!pending) return false;
  sessionStorage.removeItem(PENDING_KEY);
  return true;
}

export function dismissMagicMoment(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEEN_KEY, "1");
  sessionStorage.removeItem(PENDING_KEY);
}