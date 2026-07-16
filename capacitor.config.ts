import type { CapacitorConfig } from "@capacitor/cli";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/** Capacitor CLI does not load .env.local — read it for ios:prepare / cap sync. */
function loadEnvLocal(): void {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

loadEnvLocal();

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: process.env.IOS_BUNDLE_ID ?? "app.lumina.care",
  appName: "Lumina",
  webDir: "capacitor-www",
  backgroundColor: "#E8EBE6",
  ios: {
    // CSS owns safe-areas (viewport-fit=cover). Avoid double-insets with body/hero padding.
    contentInset: "never",
    scheme: "Lumina",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#E8EBE6",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#E8EBE6",
    },
  },
};

if (serverUrl) {
  config.server = {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    // Keep OAuth inside the WKWebView. If Google/Apple open in Safari,
    // Magic PKCE state is lost and /login/oauth shows "cancelled or failed".
    // Keep Google OAuth inside the WKWebView.
    // Do NOT include appleid.apple.com — iOS upgrades that to native SIWA and often
    // fails with "Sign Up Not Completed" for Magic Services ID (web) credentials.
    // Apple should open in Safari, then return via /login/oauth + deep link.
    allowNavigation: [
      "*.magic.link",
      "*.auth.magic.link",
      "magic.link",
      "auth.magic.link",
      "accounts.google.com",
      "*.google.com",
      "*.googleapis.com",
      "*.gstatic.com",
      "*.googleusercontent.com",
      "arbiscan.io",
      "*.arbiscan.io",
      "bridge.arbitrum.io",
      "faucet.circle.com",
      "*.alchemy.com",
      "vercel.app",
      "*.vercel.app",
      "lumina-kappa-blue.vercel.app",
    ],
  };
}

export default config;