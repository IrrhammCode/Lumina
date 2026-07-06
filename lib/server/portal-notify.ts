import type { FamilyMember } from "@/lib/family";
import type { CareRequest } from "@/lib/requests";
import type { UserRecord } from "./types";

/** Web3-only: no email. In-app polling + browser notifications handle alerts. */
export async function notifySponsorOfPortalRequest(
  _user: UserRecord,
  _member: FamilyMember,
  _request: CareRequest
): Promise<{ emailed: boolean }> {
  return { emailed: false };
}