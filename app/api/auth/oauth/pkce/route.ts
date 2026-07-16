import { type NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/server/api-utils";
import {
  clearOAuthPkce,
  loadOAuthPkce,
  saveOAuthPkce,
} from "@/lib/server/oauth-pkce-store";
import { randomBytes } from "crypto";

/**
 * POST body variants:
 * - { state, payload } → save Magic PKCE for Safari/app handoff
 * - { didToken } → save one-time ticket for deep-link into the app
 */
export async function POST(request: NextRequest) {
  const body = await parseJsonBody<{
    state?: string;
    payload?: string;
    didToken?: string;
  }>(request);

  if (body?.didToken) {
    if (body.didToken.length > 12_000) return jsonError("didToken too large");
    const ott = randomBytes(16).toString("hex");
    await saveOAuthPkce(`ott:${ott}`, JSON.stringify({ didToken: body.didToken }));
    return jsonOk({ ott });
  }

  if (!body?.state || !body?.payload) {
    return jsonError("state and payload required");
  }
  if (body.payload.length > 8_000) {
    return jsonError("payload too large");
  }
  try {
    const parsed = JSON.parse(body.payload) as { state?: string };
    if (parsed.state && parsed.state !== body.state) {
      return jsonError("state mismatch");
    }
  } catch {
    return jsonError("payload must be JSON");
  }

  await saveOAuthPkce(body.state, body.payload);
  return jsonOk({ saved: true });
}

/** GET ?state= → PKCE payload | GET ?ott= → { didToken } (single use) */
export async function GET(request: NextRequest) {
  const ott = request.nextUrl.searchParams.get("ott");
  if (ott) {
    const raw = await loadOAuthPkce(`ott:${ott}`);
    if (!raw) return jsonError("not found", 404);
    await clearOAuthPkce(`ott:${ott}`);
    try {
      const parsed = JSON.parse(raw) as { didToken?: string };
      if (!parsed.didToken) return jsonError("invalid ticket", 404);
      return jsonOk({ didToken: parsed.didToken });
    } catch {
      return jsonError("invalid ticket", 404);
    }
  }

  const state = request.nextUrl.searchParams.get("state");
  if (!state) return jsonError("state or ott required");
  const payload = await loadOAuthPkce(state);
  if (!payload) return jsonError("not found", 404);
  return jsonOk({ payload });
}

export async function DELETE(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  if (!state) return jsonError("state required");
  await clearOAuthPkce(state);
  return jsonOk({ cleared: true });
}
