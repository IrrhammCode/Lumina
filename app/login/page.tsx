"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getPostLoginPath } from "@/lib/auth";
import { preloadConnectKit } from "@/lib/connectkit-preload";
import { hasMagicConfig } from "@/lib/magic-config";
import WalletLogin from "./WalletLogin";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (!hasMagicConfig()) preloadConnectKit();
    if (isLoggedIn()) router.replace(getPostLoginPath());
  }, [router]);

  return <WalletLogin />;
}