import type { NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/server/api-utils";
import { checkRateLimit, saveWalletChallenge } from "@/lib/server/db";
import { buildSiweMessage } from "@/lib/server/siwe";

type Body = { address?: string };

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Body>(request);
  const address = body?.address?.trim();

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return jsonError("Valid wallet address is required");
  }

  const limit = await checkRateLimit(`wallet_challenge:${address.toLowerCase()}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return jsonError(`Too many attempts. Retry in ${limit.retryAfterSec}s`, 429);
  }

  const nonce = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const message = buildSiweMessage(address, nonce);
  await saveWalletChallenge(address, nonce, message);

  return jsonOk({ message, nonce });
}