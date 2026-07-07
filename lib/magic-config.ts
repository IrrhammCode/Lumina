export function hasMagicConfig(): boolean {
  const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
  return Boolean(key && key !== "pk_live_REPLACE_ME");
}

export function getMagicOAuthRedirectUri(): string {
  if (typeof window === "undefined") return "/login/oauth";
  return `${window.location.origin}/login/oauth`;
}