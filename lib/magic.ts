"use client";

import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth2";
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

function sessionFromOAuthResult(result: {
  magic: {
    idToken: string;
    userMetadata: {
      email?: string | null;
      wallets?: { ethereum?: { publicAddress?: string } };
    };
  };
  oauth: { provider: string };
}): MagicOAuthSession {
  const meta = result.magic.userMetadata;
  return {
    didToken: result.magic.idToken,
    email: meta.email ?? undefined,
    publicAddress: meta.wallets?.ethereum?.publicAddress ?? undefined,
    oauthProvider: result.oauth.provider,
  };
}

/**
 * Starts Magic OAuth.
 * - Web: full-page redirect → /login/oauth
 * - Native: popup first, then custom-scheme redirect (Lumina://) so PKCE stays in the app WebView
 */
export async function loginWithMagicOAuth(
  provider: MagicOAuthProvider
): Promise<MagicOAuthSession | void> {
  const magic = getMagic();
  if (!magic?.oauth2) throw new Error("Magic OAuth is not configured");

  const redirectURI = getMagicOAuthRedirectUri();

  if (Capacitor.isNativePlatform()) {
    try {
      const popupResult = await new Promise<MagicOAuthSession>((resolve, reject) => {
        const flow = magic.oauth2.loginWithPopup({ provider });
        flow
          .on("done", (result) => {
            try {
              resolve(sessionFromOAuthResult(result));
            } catch (err) {
              reject(err);
            }
          })
          .on("error", (reason: unknown) => {
            reject(reason instanceof Error ? reason : new Error(String(reason ?? "OAuth failed")));
          })
          .on("closed-by-user", () => {
            reject(new Error("Sign-in was cancelled"));
          });
      });
      return popupResult;
    } catch (popupErr) {
      console.warn("Magic popup OAuth failed, falling back to redirect:", popupErr);
    }
  }

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
