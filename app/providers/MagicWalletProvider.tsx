"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { hasMagicConfig } from "@/lib/magic-config";
import {
  getMagicWalletAddress,
  isMagicLoggedIn,
  logoutMagic,
} from "@/lib/magic";
import { fetchMagicWalletBalances } from "@/lib/magic-balance";
import { settleWithMagicWallet, MagicSettlementError } from "@/lib/magic-settlement";
import type { SettlementResult } from "@/lib/settlement";

type MagicWalletContextValue = {
  ready: boolean;
  isMagicMode: boolean;
  address: string | null;
  balanceUsd: number | null;
  hasGas: boolean;
  logout: () => Promise<void>;
  settle: (amount: number) => Promise<SettlementResult>;
  refresh: () => Promise<void>;
};

const defaultValue: MagicWalletContextValue = {
  ready: true,
  isMagicMode: false,
  address: null,
  balanceUsd: null,
  hasGas: false,
  logout: async () => {},
  settle: async () => {
    throw new MagicSettlementError("Magic wallet is not configured");
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
  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const [hasGas, setHasGas] = useState(false);
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
      setBalanceUsd(null);
      setHasGas(false);
      setReady(true);
      return;
    }
    const addr = await getMagicWalletAddress();
    setActive(Boolean(addr));
    setAddress(addr);
    if (addr) {
      const balances = await fetchMagicWalletBalances(addr);
      setBalanceUsd(balances?.usdtUsd ?? 0);
      setHasGas(balances?.hasGas ?? false);
    }
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
    setBalanceUsd(null);
    setHasGas(false);
  }, []);

  const settle = useCallback(async (amount: number): Promise<SettlementResult> => {
    const result = await settleWithMagicWallet(amount);
    void refresh();
    return result;
  }, [refresh]);

  const value = useMemo<MagicWalletContextValue>(
    () => ({
      ready,
      isMagicMode: active && Boolean(address),
      address,
      balanceUsd,
      hasGas,
      logout,
      settle,
      refresh,
    }),
    [ready, active, address, balanceUsd, hasGas, logout, settle, refresh]
  );

  return <MagicWalletContext.Provider value={value}>{children}</MagicWalletContext.Provider>;
}