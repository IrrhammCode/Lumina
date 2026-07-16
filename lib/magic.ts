"use client";

import { Magic } from "magic-sdk";
import { OAuthExtension, type OAuthRedirectResult } from "@magic-ext/oauth2";
import { Capacitor } from "@capacitor/core";
import { getChainConfig } from "./chain-config";

export type MagicOAuthProvider = "google" | "apple";

export type MagicOAuthSession = {
  didToken: string;
  email?: string;
  publicAddress?: string;
  oauthProvider?: string;
};

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

/** HTTPS callback for browser; custom scheme for Capacitor so Safari cannot steal the PKCE session. */
export function getMagicOAuthRedirectUri(): string {
  if (typeof window === "undefined") return "/login/oauth";
  if (Capacitor.isNativePlatform()) {
    return "Lumina://login/oauth";
  }
  return `${window.location.origin}/login/oauth`;
}

function sessionFromOAuthResult(result: OAuthRedirectResult): MagicOAuthSession {
  const meta = result.magic.userMetadata;
  return {
    didToken: result.magic.idToken,
    email: meta.email ?? undefined,
    publicAddress: meta.wallets?.ethereum?.publicAddress ?? undefined,
    oauthProvider: result.oauth.provider,
  };
}

/**
 * Starts Magic OAuth via full-page redirect.
 * - Web → https://origin/login/oauth
 * - Native → Lumina://login/oauth (custom scheme) so Safari cannot steal PKCE
 *
 * Note: loginWithPopup is intentionally NOT used on Capacitor — WKWebView blocks
 * popups and the promise hangs with no UI.
 */
export async function loginWithMagicOAuth(
  provider: MagicOAuthProvider
): Promise<MagicOAuthSession | void> {
  const magic = getMagic();
  if (!magic?.oauth2) throw new Error("Magic OAuth is not configured");

  const redirectURI = getMagicOAuthRedirectUri();

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      fn();
    };

    const timer = window.setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            `Sign-in did not start. Add to Magic Dashboard → Redirects: "${redirectURI}" and domain "${window.location.host}"`
          )
        )
      );
    }, 10_000);

    const flow = magic.oauth2.loginWithRedirect({ provider, redirectURI });

    flow
      .on("error", (reason: unknown) => {
        finish(() =>
          reject(reason instanceof Error ? reason : new Error(String(reason ?? "OAuth failed")))
        );
      })
      .on("closed-by-user", () => {
        finish(() => reject(new Error("Sign-in was cancelled")));
      })
      .on("done", () => {
        finish(resolve);
      });
  });
}

export async function handleMagicOAuthRedirect(): Promise<MagicOAuthSession | null> {
  const magic = getMagic();
  if (!magic?.oauth2) return null;
  try {
    const result = await magic.oauth2.getRedirectResult();
    return sessionFromOAuthResult(result);
  } catch (error) {
    console.error("Magic OAuth redirect error:", error);
    throw error instanceof Error ? error : new Error(String(error ?? "OAuth failed"));
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
