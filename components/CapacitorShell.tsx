"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export default function CapacitorShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.classList.add("is-native-app");
    document.body.classList.add("is-native-app");

    // Block pinch gestures that can expose WebView edges on iOS.
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
    })();

    const sub = App.addListener("appUrlOpen", ({ url }) => {
      if (!url || typeof window === "undefined") return;
      try {
        const target = new URL(url);
        if (target.pathname && target.pathname !== "/") {
          window.location.href = `${window.location.origin}${target.pathname}${target.search}`;
        }
      } catch {
        /* ignore malformed deep links */
      }
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
