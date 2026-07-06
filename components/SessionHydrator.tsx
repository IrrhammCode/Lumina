"use client";

import { useEffect } from "react";
import { isLoggedIn } from "@/lib/auth";
import { hydrateFromServer, restoreSession } from "@/lib/sync";

export default function SessionHydrator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void (async () => {
      if (isLoggedIn()) {
        await hydrateFromServer();
      } else {
        await restoreSession();
      }
    })();
  }, []);

  return <>{children}</>;
}