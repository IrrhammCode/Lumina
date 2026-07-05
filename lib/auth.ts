export type LuminaUser = {
  email: string;
  loggedIn: boolean;
  walletAddress?: string;
};

export function getStoredUser(): LuminaUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("lumina_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LuminaUser;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getStoredUser()?.loggedIn;
}

export function clearStoredUser(): void {
  localStorage.removeItem("lumina_user");
  localStorage.removeItem("lumina_onboarded");
}

const ONBOARDED_KEY = "lumina_onboarded";

export function isOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDED_KEY) === "1";
}

export function setOnboarded(): void {
  localStorage.setItem(ONBOARDED_KEY, "1");
}

export function getPostLoginPath(): string {
  return isOnboarded() ? "/dashboard" : "/onboarding";
}