export type LuminaUser = {
  email: string;
  loggedIn: boolean;
  walletAddress?: string;
  portalToken?: string;
};

const USER_KEY = "lumina_user";
const ONBOARDED_KEY = "lumina_onboarded";

export function getStoredUser(): LuminaUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LuminaUser;
  } catch {
    return null;
  }
}

export function cacheUser(user: LuminaUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isLoggedIn(): boolean {
  return !!getStoredUser()?.loggedIn;
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ONBOARDED_KEY);
  localStorage.removeItem("lumina_server_backed");
}

export function isOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDED_KEY) === "1";
}

export function setOnboarded(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDED_KEY, "1");
}

export function setOnboardedFromServer(): void {
  setOnboarded();
}

export function getPostLoginPath(): string {
  return isOnboarded() ? "/dashboard" : "/onboarding";
}

export function getPortalToken(): string | undefined {
  const token = getStoredUser()?.portalToken;
  return token || undefined;
}

export function updatePortalToken(portalToken: string): void {
  const user = getStoredUser();
  if (!user) return;
  cacheUser({ ...user, portalToken: portalToken || undefined });
}