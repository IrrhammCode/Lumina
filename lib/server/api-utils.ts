import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest } from "./auth";
import type { SessionPayload } from "./types";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export async function requireSession(request: NextRequest): Promise<SessionPayload | Response> {
  const session = await getSessionFromRequest(request);
  if (!session) return jsonError("Unauthorized", 401);
  return session;
}

export function isSession(payload: SessionPayload | Response): payload is SessionPayload {
  return "sub" in payload;
}