"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

/** Map Lumina://login/oauth?... → https://origin/login/oauth?... inside the same WebView (keeps PKCE). */
function handleNativeAuthUrl(url: string): boolean {
  if (!url || typeof window === "undefined") return false;

  const isCustomScheme = /^lumina:/i.test(url);
  const isHttpsOAuth =
    url.startsWith(window.location.origin) && url.includes("/login/oauth");

  if (!isCustomScheme && !isHttpsOAuth) {
    try {
      const target = new URL(url);
      if (target.pathname && target.pathname !== "/") {
        window.location.href = `${window.location.origin}${target.pathname}${target.search}${target.hash}`;
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  try {
    // Lumina://login/oauth?code=... → parse as https for URL API
    const normalized = isCustomScheme
      ? url.replace(/^lumina:/i, "https:")
      : url;
    const parsed = new URL(normalized);
    const path = parsed.pathname.includes("login/oauth")
      ? parsed.pathname
      : "/login/oauth";
    window.location.href = `${window.location.origin}${path}${parsed.search}${parsed.hash}`;
    return true;
  } catch {
    const qs = url.includes("?") ? url.slice(url.indexOf("?")) : "";
    window.location.href = `${window.location.origin}/login/oauth${qs}`;
    return true;
  }
}

export default function CapacitorShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add("is-native-app");
    document.body.classList.add("is-native-app");

    const lockOverscroll = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    document.addEventListener("touchmove", lockOverscroll, { passive: false });

    void (async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
        if (Capacitor.getPlatform() === "android") {
          await StatusBar.setBackgroundColor({ color: "#E8EBE6" });
        }
      } catch {
        /* plugin unavailable */
      }

      try {
        await SplashScreen.hide();
      } catch {
        /* plugin unavailable */
      }

      try {
        const launch = await App.getLaunchUrl();
        if (launch?.url) handleNativeAuthUrl(launch.url);
      } catch {
        /* no launch URL */
      }
    })();

    const sub = App.addListener("appUrlOpen", ({ url }) => {
      handleNativeAuthUrl(url);
    });

    return () => {
      document.documentElement.classList.remove("is-native-app");
      document.body.classList.remove("is-native-app");
      document.removeEventListener("touchmove", lockOverscroll);
      void sub.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
