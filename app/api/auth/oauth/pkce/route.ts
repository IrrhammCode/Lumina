import { type NextRequest } from "next/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/server/api-utils";
import {
  clearOAuthPkce,
  loadOAuthPkce,
  saveOAuthPkce,
} from "@/lib/server/oauth-pkce-store";

/** Save Magic PKCE payload before Safari handoff (keyed by OAuth state). */
export async function POST(request: NextRequest) {
  const body = await parseJsonBody<{ state?: string; payload?: string }>(request);
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

/** Restore PKCE after returning to /login/oauth (Safari or app). */
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  if (!state) return jsonError("state required");
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
