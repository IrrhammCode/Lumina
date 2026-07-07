import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/api-utils";
import { checkRateLimit } from "@/lib/server/db";
import { resolvePortalAuth } from "@/lib/server/portal-auth";
import { getRequestIp } from "@/lib/server/request-ip";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const cap = request.nextUrl.searchParams.get("cap");
  const sig = request.nextUrl.searchParams.get("sig");
  const memberId = request.nextUrl.searchParams.get("member");

  if (!memberId) {
    return jsonError("member is required");
  }

  const ip = getRequestIp(request);
  const limit = await checkRateLimit(`portal_member:${ip}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) {
    return jsonError(`Too many lookups. Retry in ${limit.retryAfterSec}s`, 429);
  }

  const auth = await resolvePortalAuth({ token, cap, sig, memberId });
  if (!auth.ok) return jsonError(auth.reason, 404);
  if (!auth.user) return jsonError("Sponsor not found", 404);

  const member = auth.user.family.find((m) => m.id === memberId);
  if (!member) return jsonError("Member not found", 404);

  return jsonOk({
    member: {
      id: member.id,
      name: member.name,
      relation: member.relation,
      countryCode: member.countryCode,
      country: member.country,
      method: member.method,
      currency: member.currency,
    },
    sponsor: auth.sponsor,
  });
}