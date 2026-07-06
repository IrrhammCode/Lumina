import type { NextRequest } from "next/server";
import { getSettlementById } from "@/lib/server/db";
import { isSession, jsonError, jsonOk, requireSession } from "@/lib/server/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const { id } = await params;
  const settlement = await getSettlementById(id);
  if (!settlement) return jsonError("Settlement not found", 404);
  if (settlement.userId !== session.sub) return jsonError("Forbidden", 403);

  return jsonOk({ settlement });
}