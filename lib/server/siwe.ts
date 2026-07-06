import { verifyMessage } from "viem";

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") ?? "localhost:3000";

export function buildSiweMessage(address: string, nonce: string): string {
  const issuedAt = new Date().toISOString();
  return [
    `${DOMAIN} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Sign in to Lumina — your diaspora care hub.",
    "",
    `URI: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}`,
    "Version: 1",
    `Chain ID: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

export async function verifySiweSignature(
  address: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    const valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    return valid;
  } catch {
    return false;
  }
}