"use client";

import dynamic from "next/dynamic";
import { hasParticleConfig } from "@/lib/particle-config";
import UADevPanelDemo from "./UADevPanelDemo";

const UADevPanelLive = dynamic(() => import("./UADevPanelLive"), { ssr: false });

export default function UADevPanel() {
  return hasParticleConfig() ? <UADevPanelLive /> : <UADevPanelDemo />;
}