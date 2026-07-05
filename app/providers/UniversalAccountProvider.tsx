"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccount } from "@particle-network/connectkit";
import {
  createUniversalAccount,
  getSmartAccountInfo,
  getUnifiedBalance,
} from "@/lib/universal-account";
import type { IAssetsResponse, UniversalAccount } from "@/lib/ua-sdk";
import { settleCarePayment, type SettlementResult } from "@/lib/settlement";

export type SmartAccountInfo = {
  ownerAddress: string;
  evmSmartAccount: string;
  solanaSmartAccount: string;
  useEIP7702: boolean;
  eip7702Delegated: boolean;
};

type UAContextValue = {
  ready: boolean;
  ua: UniversalAccount | null;
  balance: IAssetsResponse | null;
  balanceUsd: number | null;
  accountInfo: SmartAccountInfo | null;
  isUaMode: boolean;
  settle: (amount: number) => Promise<SettlementResult>;
  refreshBalance: () => Promise<void>;
};

const demoValue: UAContextValue = {
  ready: true,
  ua: null,
  balance: null,
  balanceUsd: null,
  accountInfo: null,
  isUaMode: false,
  settle: (amount) => settleCarePayment({ amount }),
  refreshBalance: async () => {},
};

const UAContext = createContext<UAContextValue>(demoValue);

export function useLuminaUA(): UAContextValue {
  return useContext(UAContext);
}

export default function UniversalAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address, connector, isConnected } = useAccount();
  const [ready, setReady] = useState(false);
  const [ua, setUa] = useState<UniversalAccount | null>(null);
  const [balance, setBalance] = useState<IAssetsResponse | null>(null);
  const [accountInfo, setAccountInfo] = useState<SmartAccountInfo | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!ua) return;
    const assets = await getUnifiedBalance(ua);
    setBalance(assets);
  }, [ua]);

  useEffect(() => {
    if (!isConnected || !address) {
      setUa(null);
      setBalance(null);
      setAccountInfo(null);
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    (async () => {
      try {
        const instance = createUniversalAccount(address);
        const info = await getSmartAccountInfo(instance);
        const assets = await getUnifiedBalance(instance);
        if (cancelled) return;
        setUa(instance);
        setAccountInfo(info);
        setBalance(assets);
      } catch (error) {
        console.error("Failed to init Universal Account:", error);
        if (!cancelled) {
          setUa(null);
          setBalance(null);
          setAccountInfo(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isConnected, address]);

  const settle = useCallback(
    (amount: number) =>
      settleCarePayment({
        amount,
        ua,
        connector: connector ?? null,
      }),
    [ua, connector]
  );

  const value = useMemo<UAContextValue>(
    () => ({
      ready,
      ua,
      balance,
      balanceUsd: balance?.totalAmountInUSD ?? null,
      accountInfo,
      isUaMode: !!ua && !!connector,
      settle,
      refreshBalance,
    }),
    [ready, ua, balance, accountInfo, connector, settle, refreshBalance]
  );

  return <UAContext.Provider value={value}>{children}</UAContext.Provider>;
}