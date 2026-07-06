import { DEFAULT_PREFS } from "@/lib/prefs";
import {
  createPortalToken,
  createUserId,
  getUserByWallet,
  normalizeWallet,
  upsertUser,
} from "./db";
import { buildDemoSeed } from "./seed";
import type { SessionPayload, UserRecord } from "./types";
import { NextResponse } from "next/server";
import { signSession, sessionCookieOptions } from "./auth";

export function walletEmail(address: string): string {
  const a = address.trim();
  return `${a.slice(0, 6)}…${a.slice(-4)}@wallet`;
}

export async function findOrCreateUserByWallet(walletAddress: string): Promise<UserRecord> {
  const normalized = normalizeWallet(walletAddress);
  const existing = await getUserByWallet(normalized);
  if (existing) return existing;

  const user: UserRecord = {
    id: createUserId(),
    email: walletEmail(normalized),
    walletAddress: normalized,
    provider: "wallet",
    onboarded: false,
    portalToken: createPortalToken(),
    createdAt: new Date().toISOString(),
    prefs: { ...DEFAULT_PREFS },
    ...buildDemoSeed(),
  };

  return upsertUser(user);
}

export async function createAuthResponse(user: UserRecord): Promise<Response> {
  const session: SessionPayload = {
    sub: user.id,
    email: user.email,
    walletAddress: user.walletAddress,
    provider: user.provider,
    onboarded: user.onboarded,
    portalToken: user.portalToken,
  };

  const token = await signSession(session);
  const response = NextResponse.json({
    ok: true,
    data: {
      user: {
        email: user.email,
        loggedIn: true,
        walletAddress: user.walletAddress,
        portalToken: user.portalToken,
        onboarded: user.onboarded,
      },
    },
  });

  response.cookies.set(sessionCookieOptions(token));
  return response;
}