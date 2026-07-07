"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { hasMagicConfig } from "@/lib/magic-config";
import {
  getMagicWalletAddress,
  isMagicLoggedIn,
  logoutMagic,
} from "@/lib/magic";
import { settleWithMagicWallet } from "@/lib/magic-settlement";
import type { SettlementResult } from "@/lib/settlement";

type MagicWalletContextValue = {
  ready: boolean;
  isMagicMode: boolean;
  address: string | null;
  logout: () => Promise<void>;
  settle: (amount: number) => Promise<SettlementResult>;
  refresh: () => Promise<void>;
};

const defaultValue: MagicWalletContextValue = {
  ready: true,
  isMagicMode: false,
  address: null,
  logout: async () => {},
  settle: async (amount) => {
    const signed = await settleWithMagicWallet(amount);
    if (signed) {
      return { ref: signed.ref, explorerUrl: signed.explorerUrl, mode: "demo" };
    }
    return { ref: `0x${Math.random().toString(16).slice(2, 10)}…arb`, mode: "demo" };
  },
  refresh: async () => {},
};

const MagicWalletContext = createContext<MagicWalletContextValue>(defaultValue);

export function useMagicWallet(): MagicWalletContextValue {
  return useContext(MagicWalletContext);
}

export default function MagicWalletProvider({ children }: { children: React.ReactNode }) {
  const enabled = hasMagicConfig();
  const [ready, setReady] = useState(!enabled);
  const [address, setAddress] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setReady(true);
      return;
    }
    const loggedIn = await isMagicLoggedIn();
    if (!loggedIn) {
      setActive(false);
      setAddress(null);
      setReady(true);
      return;
    }
    const addr = await getMagicWalletAddress();
    setActive(Boolean(addr));
    setAddress(addr);
    setReady(true);
  }, [enabled]);

  useEffect(() => {
    void refresh();
    const onLogin = () => void refresh();
    window.addEventListener("lumina:login", onLogin);
    return () => window.removeEventListener("lumina:login", onLogin);
  }, [refresh]);

  const logout = useCallback(async () => {
    await logoutMagic();
    setActive(false);
    setAddress(null);
  }, []);

  const settle = useCallback(async (amount: number): Promise<SettlementResult> => {
    const signed = await settleWithMagicWallet(amount);
    if (signed) {
      return {
        ref: signed.ref,
        explorerUrl: signed.explorerUrl,
        mode: "demo",
      };
    }
    return { ref: `0x${Math.random().toString(16).slice(2, 10)}…arb`, mode: "demo" };
  }, []);

  const value = useMemo<MagicWalletContextValue>(
    () => ({
      ready,
      isMagicMode: active && Boolean(address),
      address,
      logout,
      settle,
      refresh,
    }),
    [ready, active, address, logout, settle, refresh]
  );

  return <MagicWalletContext.Provider value={value}>{children}</MagicWalletContext.Provider>;
}