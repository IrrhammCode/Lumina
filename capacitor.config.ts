import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: process.env.IOS_BUNDLE_ID ?? "app.lumina.care",
  appName: "Lumina",
  webDir: "capacitor-www",
  backgroundColor: "#E8EBE6",
  ios: {
    contentInset: "automatic",
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
    allowNavigation: [
      "*.magic.link",
      "*.auth.magic.link",
      "magic.link",
      "arbiscan.io",
      "*.arbiscan.io",
      "bridge.arbitrum.io",
      "faucet.circle.com",
      "*.alchemy.com",
      "vercel.app",
      "*.vercel.app",
    ],
  };
}

export default config;