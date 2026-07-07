"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { isLoggedIn, getPostLoginPath } from "@/lib/auth";
import { useConnectKitReady } from "@/app/providers/ParticleProvider";
import { hasParticleConfig } from "@/lib/particle-config";
import PageLoading from "@/components/PageLoading";

const WalletLogin = dynamic(() => import("./WalletLogin"), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  const connectKitReady = useConnectKitReady();

  useEffect(() => {
    if (isLoggedIn()) router.replace(getPostLoginPath());
  }, [router]);

  if (hasParticleConfig() && !connectKitReady) return <PageLoading />;

  return <WalletLogin />;
}