"use client";

import React from "react";
import dynamic from "next/dynamic";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
const clientKey = process.env.NEXT_PUBLIC_CLIENT_KEY;
const appId = process.env.NEXT_PUBLIC_APP_ID;

const hasParticleConfig =
  !!projectId &&
  !!clientKey &&
  !!appId &&
  projectId !== "dummy_project_id" &&
  clientKey !== "dummy_client_key" &&
  appId !== "dummy_app_id";

const ConnectKitProviderLazy = dynamic(
  () => import("./ConnectKitProviderInner"),
  { ssr: false }
);

export default function ParticleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasParticleConfig) {
    return <>{children}</>;
  }

  return <ConnectKitProviderLazy>{children}</ConnectKitProviderLazy>;
}