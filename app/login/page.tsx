"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { isLoggedIn, getPostLoginPath } from "@/lib/auth";

const WalletLogin = dynamic(() => import("./WalletLogin"), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn()) router.replace(getPostLoginPath());
  }, [router]);

  return <WalletLogin />;
}