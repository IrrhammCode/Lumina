import type { Connector } from "@particle-network/connector-core";
import { signUaRootHash } from "./wallet-client";

export async function signSiweMessage(
  connector: Connector,
  message: string
): Promise<string> {
  return signUaRootHash(connector, message);
}