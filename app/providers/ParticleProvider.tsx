"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import SessionHydrator from "@/components/SessionHydrator";
import { hasParticleConfig } from "@/lib/particle-config";


type ConnectKitStatus = {
  ready: boolean;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

const ConnectKitStatusContext = createContext<ConnectKitStatus>({
  ready: false,
  loading: false,
  error: false,
  retry: () => {},
});

export function useConnectKitReady(): boolean {
  return useContext(ConnectKitStatusContext).ready;
}

export function useConnectKitStatus(): ConnectKitStatus {
  return useContext(ConnectKitStatusContext);
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
  const [loading, setLoading] = useState(particleEnabled);
  const [error, setError] = useState(false);

  const loadConnectKit = useCallback(() => {
    if (!particleEnabled) return;
    setLoading(true);
    setError(false);
    void import("./ConnectKitProviderInner")
      .then((mod) => setConnectKit(() => mod.default))
      .catch((err) => {
        console.error("ConnectKit failed to load:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [particleEnabled]);

  useEffect(() => {
    loadConnectKit();
  }, [loadConnectKit]);

  const status = useMemo<ConnectKitStatus>(
    () => ({
      ready: Boolean(ConnectKit),
      loading,
      error,
      retry: loadConnectKit,
    }),
    [ConnectKit, loading, error, loadConnectKit]
  );

  const shell = (
    <ConnectKitStatusContext.Provider value={status}>
      <SessionHydrator>{children}</SessionHydrator>
    </ConnectKitStatusContext.Provider>
  );

  if (!particleEnabled || !ConnectKit) return shell;

  return <ConnectKit>{shell}</ConnectKit>;
}