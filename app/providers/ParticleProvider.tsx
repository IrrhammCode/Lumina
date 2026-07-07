"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import SessionHydrator from "@/components/SessionHydrator";
import { hasParticleConfig } from "@/lib/particle-config";

const ConnectKitReadyContext = createContext(false);

export function useConnectKitReady(): boolean {
  return useContext(ConnectKitReadyContext);
}

export default function ParticleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const particleEnabled = hasParticleConfig();
  const [ConnectKit, setConnectKit] = useState<React.ComponentType<{
    children: React.ReactNode;
  }> | null>(null);

  useEffect(() => {
    if (!particleEnabled) return;
    void import("./ConnectKitProviderInner")
      .then((mod) => setConnectKit(() => mod.default))
      .catch((err) => console.error("ConnectKit failed to load:", err));
  }, [particleEnabled]);

  const shell = (
    <ConnectKitReadyContext.Provider value={Boolean(ConnectKit)}>
      <SessionHydrator>{children}</SessionHydrator>
    </ConnectKitReadyContext.Provider>
  );

  if (!particleEnabled || !ConnectKit) return shell;

  return <ConnectKit>{shell}</ConnectKit>;
}