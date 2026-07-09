"use client";

import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth2";
import { getChainConfig } from "./chain-config";

export type MagicOAuthProvider = "google" | "apple";

type MagicInstance = Magic<[OAuthExtension]>;

let magicInstance: MagicInstance | null = null;

export function getMagic(): MagicInstance | null {
  if (typeof window === "undefined") return null;

  if (!magicInstance) {
    const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
    if (!key) return null;
    // https://docs.magic.link/embedded-wallets/blockchains/evm/arbitrum
    const chain = getChainConfig();
    magicInstance = new Magic(key, {
      network: {
        rpcUrl: chain.rpcUrl,
        chainId: chain.chainId,
      },
      extensions: [new OAuthExtension()],
    });
  }
  return magicInstance;
}

export async function getMagicDidToken(): Promise<string | null> {
  const magic = getMagic();
  if (!magic) return null;
  try {
    return await magic.user.getIdToken();
  } catch {
    return null;
  }
}

export async function getMagicWalletAddress(): Promise<string | null> {
  const magic = getMagic();
  if (!magic) return null;
  try {
    const info = await magic.user.getInfo();
    return info.wallets?.ethereum?.publicAddress ?? null;
  } catch {
    return null;
  }
}

export async function loginWithMagicEmail(email: string): Promise<string | null> {
  const magic = getMagic();
  if (!magic) return null;
  try {
    return await magic.auth.loginWithEmailOTP({ email });
  } catch (error) {
    console.error("Magic email login error:", error);
    return null;
  }
}

export async function loginWithMagicOAuth(provider: MagicOAuthProvider): Promise<void> {
  const magic = getMagic();
  if (!magic?.oauth2) throw new Error("Magic OAuth is not configured");
  const redirectURI =
    typeof window !== "undefined" ? `${window.location.origin}/login/oauth` : "/login/oauth";
  await magic.oauth2.loginWithRedirect({ provider, redirectURI });
}

export async function handleMagicOAuthRedirect(): Promise<{
  didToken: string;
  email?: string;
  publicAddress?: string;
  oauthProvider?: string;
} | null> {
  const magic = getMagic();
  if (!magic?.oauth2) return null;
  try {
    const result = await magic.oauth2.getRedirectResult();
    const didToken = result.magic.idToken;
    const meta = result.magic.userMetadata;
    return {
      didToken,
      email: meta.email ?? undefined,
      publicAddress: meta.wallets?.ethereum?.publicAddress ?? undefined,
      oauthProvider: result.oauth.provider,
    };
  } catch (error) {
    console.error("Magic OAuth redirect error:", error);
    return null;
  }
}

export async function isMagicLoggedIn(): Promise<boolean> {
  const magic = getMagic();
  if (!magic) return false;
  try {
    return await magic.user.isLoggedIn();
  } catch {
    return false;
  }
}

export async function logoutMagic(): Promise<void> {
  const magic = getMagic();
  if (!magic) return;
  try {
    await magic.user.logout();
  } catch (error) {
    console.error("Magic logout error:", error);
  }
}

export function getMagicProvider() {
  const magic = getMagic();
  if (!magic) return null;
  return magic.rpcProvider;
}

/**
 * Magic quickstart step 3 — connect embedded wallet before sending tx.
 * @see https://docs.magic.link/embedded-wallets/blockchains/evm/arbitrum
 */
export async function connectMagicWallet(): Promise<string | null> {
  const magic = getMagic();
  if (!magic) return null;
  try {
    const accounts = await magic.wallet.connectWithUI();
    return accounts[0] ?? (await getMagicWalletAddress());
  } catch {
    return getMagicWalletAddress();
  }
}