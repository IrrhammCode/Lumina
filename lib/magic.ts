"use client";

import { Magic } from "magic-sdk";

let magicInstance: Magic | null = null;

export function getMagic(): Magic | null {
  if (typeof window === "undefined") return null;

  if (!magicInstance) {
    const key = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
    if (!key) {
      console.warn("Magic publishable key is not set");
      return null;
    }
    magicInstance = new Magic(key);
  }
  return magicInstance;
}

export async function loginWithEmail(email: string): Promise<string | null> {
  const magic = getMagic();
  if (!magic) return null;

  try {
    const didToken = await magic.auth.loginWithEmailOTP({ email });
    return didToken;
  } catch (error) {
    console.error("Magic login error:", error);
    return null;
  }
}

export async function getUserInfo() {
  const magic = getMagic();
  if (!magic) return null;

  try {
    const userMetadata = await magic.user.getInfo();
    return userMetadata;
  } catch {
    return null;
  }
}

export async function isLoggedIn(): Promise<boolean> {
  const magic = getMagic();
  if (!magic) return false;

  try {
    return await magic.user.isLoggedIn();
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
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
