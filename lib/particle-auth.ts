import type { Connector } from "@particle-network/connector-core";

export type ParticleSocialType = "google" | "apple";

export function findParticleAuthConnector(
  connectors: readonly Connector[]
): Connector | undefined {
  return connectors.find(
    (c) => c.id === "particleAuth" || c.walletConnectorType === "particleAuth"
  );
}

export function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}