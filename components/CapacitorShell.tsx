"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export default function CapacitorShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void (async () => {
      try {
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
      void sub.then((handle) => handle.remove());
    };
  }, []);

  return null;
}