import type { NextRequest } from "next/server";
import type { FamilyMember } from "@/lib/family";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { addFamilyMember, getUserData, setFamily } from "@/lib/server/user-data";

type PostBody = Omit<FamilyMember, "id">;
type PutBody = { members?: FamilyMember[] };

export async function GET(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  return jsonOk({ family: user.family });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<PostBody>(request);
  if (!body?.name) return jsonError("Member name is required");

  const result = await addFamilyMember(session.sub, body);
  if (!result) return jsonError("Failed to add member", 500);

  return jsonOk({ member: result.member, family: result.user.family });
}

export async function PUT(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<PutBody>(request);
  if (!body?.members || !Array.isArray(body.members)) {
    return jsonError("members array is required");
  }

  const updated = await setFamily(session.sub, body.members);
  if (!updated) return jsonError("Update failed", 500);

  return jsonOk({ family: updated.family });
}