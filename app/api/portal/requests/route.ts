import type { NextRequest } from "next/server";
import type { NeedType } from "@/lib/allowances";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/server/api-utils";
import { checkRateLimit } from "@/lib/server/db";
import { getRequestIp } from "@/lib/server/request-ip";
import { notifySponsorOfPortalRequest } from "@/lib/server/portal-notify";
import { resolvePortalAuth } from "@/lib/server/portal-auth";
import { addRequest } from "@/lib/server/user-data";

type Body = {
  token?: string;
  cap?: string;
  sig?: string;
  memberId?: string;
  needType?: NeedType;
  title?: string;
  message?: string;
  amount?: number;
  dueLabel?: string;
  billNote?: string;
};

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Body>(request);
  const memberId = body?.memberId?.trim();

  if (!memberId || !body?.needType || !body?.title) {
    return jsonError("Invalid portal request payload");
  }

  const ip = getRequestIp(request);
  const ipLimit = await checkRateLimit(`portal_req:ip:${ip}`, 30, 60 * 60 * 1000);
  if (!ipLimit.allowed) {
    return jsonError(`Too many requests. Retry in ${ipLimit.retryAfterSec}s`, 429);
  }

  const auth = await resolvePortalAuth({
    token: body.token,
    cap: body.cap,
    sig: body.sig,
    memberId,
  });
  if (!auth.ok) return jsonError(auth.reason, 404);
  if (!auth.user) return jsonError("Sponsor not found", 404);

  const tokenLimit = await checkRateLimit(
    `portal_req:sponsor:${auth.sponsor}`,
    20,
    60 * 60 * 1000
  );
  if (!tokenLimit.allowed) {
    return jsonError(`Too many requests from this link. Retry in ${tokenLimit.retryAfterSec}s`, 429);
  }

  const member = auth.user.family.find((m) => m.id === memberId);
  if (!member) return jsonError("Member not found", 404);

  const amount = Number(body.amount) || 0;
  if (amount <= 0 || amount > 50_000) {
    return jsonError("Amount must be between $0.01 and $50,000");
  }

  const requestRecord = {
    id: `req_${Date.now()}`,
    memberId,
    needType: body.needType,
    title: body.title.slice(0, 200),
    message: (body.message ?? "").slice(0, 2000),
    amount,
    dueLabel: (body.dueLabel ?? "").slice(0, 100),
    billNote: (body.billNote ?? "").slice(0, 500),
    status: "pending" as const,
    source: "family" as const,
    createdAt: new Date().toISOString(),
  };

  const updated = await addRequest(auth.user.id, requestRecord);
  if (!updated) return jsonError("Failed to submit request", 500);

  const { emailed } = await notifySponsorOfPortalRequest(auth.user, member, requestRecord);

  return jsonOk({ request: requestRecord, notified: emailed });
}