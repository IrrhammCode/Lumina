import type { NextRequest } from "next/server";
import { isSession, jsonError, jsonOk, requireSession } from "@/lib/server/api-utils";
import { removeFamilyMember } from "@/lib/server/user-data";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const { id } = await params;
  const updated = await removeFamilyMember(session.sub, id);
  if (!updated) return jsonError("User not found", 404);

  return jsonOk({ family: updated.family });
}