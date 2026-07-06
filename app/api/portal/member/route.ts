import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/server/api-utils";
import { checkRateLimit, getUserByPortalToken } from "@/lib/server/db";
import { getRequestIp } from "@/lib/server/request-ip";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const memberId = request.nextUrl.searchParams.get("member");

  if (!token || !memberId) {
    return jsonError("token and member are required");
  }

  const ip = getRequestIp(request);
  const limit = await checkRateLimit(`portal_member:${token}:${ip}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) {
    return jsonError(`Too many lookups. Retry in ${limit.retryAfterSec}s`, 429);
  }

  const user = await getUserByPortalToken(token);
  if (!user || !user.portalToken) return jsonError("Invalid or revoked portal link", 404);

  const member = user.family.find((m) => m.id === memberId);
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
  });
}