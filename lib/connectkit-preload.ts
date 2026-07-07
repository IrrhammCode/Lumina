/** Warm up Particle ConnectKit chunk before the login screen needs it. */
export function preloadConnectKit(): void {
  if (typeof window === "undefined") return;
  void import("@/app/providers/ConnectKitProviderInner");
}