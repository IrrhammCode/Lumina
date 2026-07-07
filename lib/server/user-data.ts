import type { AllowanceRule, PaymentRecord } from "@/lib/allowances";
import type { FamilyMember } from "@/lib/family";
import type { LuminaPrefs } from "@/lib/prefs";
import type { CareRequest } from "@/lib/requests";
import { createPortalToken, getUserById, updateUser } from "./db";
import type { UserDataSnapshot, UserRecord } from "./types";

export async function getUserData(userId: string): Promise<UserRecord | null> {
  return getUserById(userId);
}

export async function patchUserData(
  userId: string,
  patch: Partial<UserDataSnapshot>
): Promise<UserRecord | null> {
  return updateUser(userId, patch);
}

export async function getSnapshot(userId: string): Promise<UserDataSnapshot | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  return {
    prefs: user.prefs,
    family: user.family,
    requests: user.requests,
    rules: user.rules,
    payments: user.payments,
    carePledgeRef: user.carePledgeRef,
  };
}

export async function setFamily(userId: string, family: FamilyMember[]): Promise<UserRecord | null> {
  return updateUser(userId, { family });
}

export async function addFamilyMember(
  userId: string,
  input: Omit<FamilyMember, "id">
): Promise<{ user: UserRecord; member: FamilyMember } | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  const member: FamilyMember = { ...input, id: `fam_${Date.now()}` };
  const next = await updateUser(userId, { family: [...user.family, member] });
  if (!next) return null;
  return { user: next, member };
}

export async function removeFamilyMember(userId: string, memberId: string): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  return updateUser(userId, { family: user.family.filter((m) => m.id !== memberId) });
}

export async function addRequest(userId: string, request: CareRequest): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  return updateUser(userId, { requests: [request, ...user.requests] });
}

export async function patchRequest(
  userId: string,
  requestId: string,
  patch: Partial<CareRequest>
): Promise<{ user: UserRecord; request: CareRequest } | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  let updated: CareRequest | null = null;
  const requests = user.requests.map((r) => {
    if (r.id !== requestId) return r;
    updated = { ...r, ...patch };
    return updated;
  });
  if (!updated) return null;
  const next = await updateUser(userId, { requests });
  if (!next) return null;
  return { user: next, request: updated };
}

export async function upsertRule(userId: string, rule: AllowanceRule): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  const idx = user.rules.findIndex((r) => r.id === rule.id);
  const rules = [...user.rules];
  if (idx >= 0) rules[idx] = rule;
  else rules.push(rule);
  return updateUser(userId, { rules });
}

export async function deleteRule(userId: string, ruleId: string): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  return updateUser(userId, { rules: user.rules.filter((r) => r.id !== ruleId) });
}

export async function addPayment(userId: string, payment: PaymentRecord): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  return updateUser(userId, { payments: [payment, ...user.payments] });
}

export async function resolvePendingAutopilotPayment(
  userId: string,
  ruleId: string,
  completed: PaymentRecord
): Promise<UserRecord | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  const payments = [
    completed,
    ...user.payments.filter(
      (p) => !(p.ruleId === ruleId && p.type === "auto" && p.status === "pending")
    ),
  ];
  return updateUser(userId, { payments });
}

export async function setPrefs(userId: string, prefs: LuminaPrefs): Promise<UserRecord | null> {
  return updateUser(userId, { prefs });
}

export async function rotatePortalToken(userId: string): Promise<UserRecord | null> {
  return updateUser(userId, { portalToken: createPortalToken() });
}

export async function revokePortalToken(userId: string): Promise<UserRecord | null> {
  return updateUser(userId, { portalToken: "" });
}

export async function markOnboarded(userId: string, family?: FamilyMember[]): Promise<UserRecord | null> {
  const patch: Partial<UserRecord> = { onboarded: true };
  if (family) patch.family = family;
  return updateUser(userId, patch);
}