"use client";

import React from "react";
import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import { arbitrum, arbitrumSepolia, base, mainnet } from "viem/chains";
import UniversalAccountProvider from "./UniversalAccountProvider";
import { wallet, EntryPosition } from "@particle-network/connectkit/wallet";

const config = createConfig({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
  appId: process.env.NEXT_PUBLIC_APP_ID!,
  appearance: {
    mode: "light",
    connectorsOrder: ["social", "email", "phone", "wallet"],
    splitEmailAndPhone: false,
    hideContinueButton: false,
    collapseWalletList: true,
    theme: {
      "--pcm-accent-color": "#2a5a18",
      "--pcm-primary-button-bankground": "#163300",
      "--pcm-primary-button-hover-background": "#1e4d0e",
      "--pcm-body-background": "#E8EBE6",
      "--pcm-rounded-md": "12px",
      "--pcm-rounded-lg": "16px",
    },
  },
  walletConnectors: [
    authWalletConnectors({
      authTypes: ["google", "apple", "email"],
      fiatCoin: "USD",
      promptSettingConfig: {
        promptMasterPasswordSettingWhenLogin: 0,
        promptPaymentPasswordSettingWhenSign: 0,
      },
    }),
  ],
  plugins: [
    wallet({
      entryPosition: EntryPosition.TR,
      visible: false,
    }),
  ],
  chains: [arbitrum, base, mainnet, arbitrumSepolia],
});

export default function ConnectKitProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConnectKitProvider config={config}>
      <UniversalAccountProvider>{children}</UniversalAccountProvider>
    </ConnectKitProvider>
  );
}