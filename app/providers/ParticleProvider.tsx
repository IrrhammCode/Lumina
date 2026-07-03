"use client";

import React from "react";
import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import { arbitrum, arbitrumSepolia } from "viem/chains";
import { wallet, EntryPosition } from "@particle-network/connectkit/wallet";

const config = createConfig({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || "dummy_project_id",
  clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY || "dummy_client_key",
  appId: process.env.NEXT_PUBLIC_APP_ID || "dummy_app_id",
  walletConnectors: [
    authWalletConnectors({
      authTypes: ["google", "apple", "email", "phone"],
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
      visible: false, // Invisible wallet — no wallet UI exposed to user
    }),
  ],
  chains: [arbitrum, arbitrumSepolia],
});

export default function ParticleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
}
