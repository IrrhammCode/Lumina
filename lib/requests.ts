import { api } from "./api-client";
import { isLoggedIn } from "./auth";
import { confirmSettlementAfterPay } from "./settlement-poll";

import type { PaymentSettlementFields } from "./settlement";
import { getMemberById } from "./family";
import { addPayment, getPayments, NEED_META, type NeedType } from "./allowances";
import { emitNewRequest } from "./events";

export type RequestStatus = "pending" | "declined" | "paid";

export type RequestSource = "family" | "caregiver";

export type CareRequest = {
  id: string;
  memberId: string;
  needType: NeedType;
  title: string;
  message: string;
  amount: number;
  dueLabel: string;
  billNote: string;
  status: RequestStatus;
  source: RequestSource;
  createdAt: string;
  resolvedAt?: string;
};

const REQUESTS_KEY = "lumina_requests";

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function migrateRequest(raw: Record<string, unknown>): CareRequest {
  return {
    ...(raw as unknown as CareRequest),
    source: (raw.source as RequestSource) ?? "family",
  };
}

export function getRequests(): CareRequest[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REQUESTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return parsed.map(migrateRequest);
  } catch {
    return [];
  }
}

export function saveRequests(requests: CareRequest[]): void {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function getRequestById(id: string): CareRequest | undefined {
  return getRequests().find((r) => r.id === id);
}

export function getPendingRequests(): CareRequest[] {
  return getRequests().filter((r) => r.status === "pending");
}

export function formatDueFromDays(days: number): string {
  const d = addDays(new Date(), days);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function buildRequestTitle(needType: NeedType, relation: string, billNote?: string): string {
  const meta = NEED_META[needType];
  const shortBill = billNote?.split("·")[0]?.trim();
  if (shortBill) return `${meta.label} — ${shortBill}`;
  return `${meta.label} for ${relation}`;
}

export function defaultRequestMessage(needType: NeedType, relation: string): string {
  const lines: Record<NeedType, string> = {
    pulsa: `Hi, I need pulsa top-up. Can you help, ${relation === "Mom" || relation === "Dad" ? "" : ""}?`.replace(", ?", "?"),
    electricity: "Electric bill arrived. Due soon — can you cover it?",
    school: "School fee is coming up. Can you help with tuition?",
    health: "Need help with a medical expense this week.",
    rent: "Rent is due soon. Can you send support?",
    custom: "I need help with an expense back home.",
  };
  return lines[needType];
}

export async function createRequest(input: {
  memberId: string;
  needType: NeedType;
  title: string;
  message: string;
  amount: number;
  dueLabel: string;
  billNote: string;
  source: RequestSource;
  portalToken?: string;
  portalCap?: string;
  portalSig?: string;
}): Promise<CareRequest> {
  const hasPortalAuth =
    input.source === "family" &&
    (input.portalCap && input.portalSig ? true : Boolean(input.portalToken));

  if (hasPortalAuth) {
    const remote = await api.createPortalRequest({
      token: input.portalToken,
      cap: input.portalCap,
      sig: input.portalSig,
      memberId: input.memberId,
      needType: input.needType,
      title: input.title,
      message: input.message,
      amount: input.amount,
      dueLabel: input.dueLabel,
      billNote: input.billNote,
    });
    if (remote.ok) {
      emitNewRequest(remote.data.request);
      return remote.data.request;
    }
  }

  const request: CareRequest = {
    id: `req_${Date.now()}`,
    ...input,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  if (isLoggedIn()) {
    const remote = await api.createRequest(input);
    if (remote.ok) {
      saveRequests([remote.data.request, ...getRequests()]);
      emitNewRequest(remote.data.request);
      return remote.data.request;
    }
  }

  saveRequests([request, ...getRequests()]);
  emitNewRequest(request);
  return request;
}

export async function declineRequest(id: string): Promise<boolean> {
  const request = getRequestById(id);
  if (!request || request.status !== "pending") return false;

  if (isLoggedIn()) {
    const remote = await api.patchRequest(id, "decline");
    if (remote.ok) {
      saveRequests(
        getRequests().map((r) => (r.id === id ? remote.data.request : r))
      );
      return true;
    }
    return false;
  }

  saveRequests(
    getRequests().map((r) =>
      r.id === id ? { ...r, status: "declined" as const, resolvedAt: new Date().toISOString() } : r
    )
  );
  return true;
}

export type ApproveRequestResult = { ok: true } | { ok: false; reason?: string };

export async function approveRequest(
  id: string,
  settlement?: PaymentSettlementFields
): Promise<ApproveRequestResult> {
  const request = getRequestById(id);
  const member = request ? getMemberById(request.memberId) : undefined;
  if (!request || !member || request.status !== "pending") {
    return { ok: false, reason: "Request not found" };
  }

  if (isLoggedIn()) {
    const result = await confirmSettlementAfterPay({
      requestId: id,
      amount: request.amount,
      kind: "pull",
      settlement: settlement ?? { settlementRef: "", settlementMode: "ua" },
    });
    if (!result.ok) return { ok: false, reason: result.reason };
    return { ok: true };
  }

  addPayment({
    id: `pay_${Date.now()}`,
    requestId: request.id,
    ruleLabel: request.title,
    memberId: member.id,
    memberName: member.name,
    countryCode: member.countryCode,
    needType: request.needType,
    amount: request.amount,
    type: "pull",
    status: "completed",
    date: new Date().toISOString(),
    settlementRef: settlement?.settlementRef ?? "",
    settlementExplorerUrl: settlement?.settlementExplorerUrl,
    settlementMode: settlement?.settlementMode ?? "magic",
  });

  saveRequests(
    getRequests().map((r) =>
      r.id === id ? { ...r, status: "paid" as const, resolvedAt: new Date().toISOString() } : r
    )
  );
  return { ok: true };
}

export function formatRequestAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function getRequestMeta(needType: NeedType) {
  return NEED_META[needType];
}