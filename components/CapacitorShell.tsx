"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { installMagicPkceBridge } from "@/lib/magic-pkce-bridge";

/**
 * Lumina://login/oauth?code=...&state=...
 * MUST NOT use `new URL(url.replace('lumina:', 'https:'))` — that parses host as "login"
 * and pathname as "/oauth", dropping the correct path.
 */
function handleNativeAuthUrl(url: string): boolean {
  if (!url || typeof window === "undefined") return false;

  if (/^lumina:/i.test(url)) {
    const rest = url.replace(/^lumina:\/\//i, "");
    const hashIdx = rest.indexOf("#");
    const hash = hashIdx >= 0 ? rest.slice(hashIdx) : "";
    const beforeHash = hashIdx >= 0 ? rest.slice(0, hashIdx) : rest;
    const qIdx = beforeHash.indexOf("?");
    const pathRaw = qIdx >= 0 ? beforeHash.slice(0, qIdx) : beforeHash;
    const search = qIdx >= 0 ? beforeHash.slice(qIdx) : "";
    const path = pathRaw.startsWith("/") ? pathRaw : `/${pathRaw || "login/oauth"}`;
    window.location.href = `${window.location.origin}${path}${search}${hash}`;
    return true;
  }

  if (url.startsWith(window.location.origin) && url.includes("/login/oauth")) {
    window.location.href = url;
    return true;
  }

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

export default function CapacitorShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add("is-native-app");
    document.body.classList.add("is-native-app");

    const uninstallPkceBridge = installMagicPkceBridge();

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
      uninstallPkceBridge();
      document.documentElement.classList.remove("is-native-app");
      document.body.classList.remove("is-native-app");
      document.removeEventListener("touchmove", lockOverscroll);
      void sub.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
