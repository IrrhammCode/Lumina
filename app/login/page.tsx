"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { isLoggedIn, getPostLoginPath } from "@/lib/auth";
import { hasParticleConfig } from "@/lib/particle-config";

const ParticleLogin = dynamic(() => import("./ParticleLogin"), { ssr: false });
const MockLogin = dynamic(() => import("./MockLogin"), { ssr: false });

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn()) router.replace(getPostLoginPath());
  }, [router]);

  return hasParticleConfig() ? <ParticleLogin /> : <MockLogin />;
}