import type { AllowanceRule, NeedType, PaymentRecord } from "./allowances";
import type { FamilyMember } from "./family";
import type { LuminaPrefs } from "./prefs";
import type { CareRequest, RequestSource } from "./requests";
import type { LuminaUser } from "./auth";

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
    const json = (await res.json()) as ApiResult<T>;
    if (!res.ok || !json.ok) {
      return { ok: false, error: "error" in json ? json.error : res.statusText };
    }
    return json;
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export const api = {
  sendOtp(email: string) {
    return apiFetch<{ sent: boolean; devCode?: string }>("/api/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  verifyOtp(email: string, code: string) {
    return apiFetch<{ user: LuminaUser & { portalToken?: string; onboarded?: boolean } }>(
      "/api/auth/otp/verify",
      { method: "POST", body: JSON.stringify({ email, code }) }
    );
  },

  socialLogin(provider: "google" | "apple", email?: string) {
    return apiFetch<{ user: LuminaUser & { portalToken?: string; onboarded?: boolean } }>(
      "/api/auth/social",
      { method: "POST", body: JSON.stringify({ provider, email }) }
    );
  },

  walletChallenge(address: string) {
    return apiFetch<{ message: string; nonce: string }>("/api/auth/wallet/challenge", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  },

  walletVerify(address: string, message: string, signature: string) {
    return apiFetch<{ user: LuminaUser & { portalToken?: string; onboarded?: boolean } }>(
      "/api/auth/wallet/verify",
      { method: "POST", body: JSON.stringify({ address, message, signature }) }
    );
  },

  /** Dev-only fallback when SIWE is skipped */
  walletLogin(address: string) {
    return apiFetch<{ user: LuminaUser & { portalToken?: string; onboarded?: boolean } }>(
      "/api/auth/wallet",
      { method: "POST", body: JSON.stringify({ address }) }
    );
  },

  getSession() {
    return apiFetch<{ user: LuminaUser & { portalToken?: string; onboarded?: boolean } }>(
      "/api/auth/session"
    );
  },

  logout() {
    return apiFetch<{ loggedOut: boolean }>("/api/auth/logout", { method: "POST" });
  },

  getUserData() {
    return apiFetch<{
      prefs: LuminaPrefs;
      family: FamilyMember[];
      requests: CareRequest[];
      rules: AllowanceRule[];
      payments: PaymentRecord[];
    }>("/api/user/data");
  },

  rotatePortalToken() {
    return apiFetch<{ portalToken: string }>("/api/user/portal-token", { method: "POST" });
  },

  revokePortalToken() {
    return apiFetch<{ revoked: boolean }>("/api/user/portal-token", { method: "DELETE" });
  },

  completeOnboarding(family?: FamilyMember[]) {
    return apiFetch<{ onboarded: boolean }>("/api/user/onboarding", {
      method: "POST",
      body: JSON.stringify({ family }),
    });
  },

  getPrefs() {
    return apiFetch<{ prefs: LuminaPrefs }>("/api/user/prefs");
  },

  patchPrefs(patch: Partial<LuminaPrefs>) {
    return apiFetch<{ prefs: LuminaPrefs }>("/api/user/prefs", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  putFamily(members: FamilyMember[]) {
    return apiFetch<{ family: FamilyMember[] }>("/api/family", {
      method: "PUT",
      body: JSON.stringify({ members }),
    });
  },

  addFamilyMember(input: Omit<FamilyMember, "id">) {
    return apiFetch<{ member: FamilyMember; family: FamilyMember[] }>("/api/family", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  removeFamilyMember(id: string) {
    return apiFetch<{ family: FamilyMember[] }>(`/api/family/${id}`, { method: "DELETE" });
  },

  createRequest(input: {
    memberId: string;
    needType: NeedType;
    title: string;
    message: string;
    amount: number;
    dueLabel: string;
    billNote: string;
    source: RequestSource;
  }) {
    return apiFetch<{ request: CareRequest }>("/api/requests", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  autopilotTick() {
    return apiFetch<{
      usersScanned: number;
      dueFound: number;
      completed: number;
      queued: number;
      skipped: number;
      errors: string[];
    }>("/api/autopilot/tick", { method: "POST" });
  },

  getAutopilotPending() {
    return apiFetch<{
      pending: PaymentRecord[];
      rules: AllowanceRule[];
    }>("/api/autopilot/pending");
  },

  verifySettlement(input: {
    requestId?: string;
    ruleId?: string;
    memberId?: string;
    needType?: NeedType;
    kind?: "pull" | "manual" | "auto";
    amount: number;
    uaTransactionId?: string;
    txHash?: string;
    settlementRef: string;
    explorerUrl?: string;
    settlementMode?: "ua" | "demo";
  }) {
    return apiFetch<{
      status: "verified" | "pending" | "failed";
      settlement?: {
        id: string;
        status: "pending" | "verified" | "failed";
        uaTransactionId?: string;
      };
      payment?: PaymentRecord;
      request?: CareRequest;
      reason?: string;
    }>("/api/settlements/verify", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getSettlement(id: string) {
    return apiFetch<{
      settlement: {
        id: string;
        status: "pending" | "verified" | "failed";
        uaTransactionId?: string;
        txHash?: string;
        amount: number;
        kind: "pull" | "manual" | "auto";
      };
    }>(`/api/settlements/${id}`);
  },

  patchRequest(
    id: string,
    action: "decline" | "approve",
    settlement?: {
      settlementRef?: string;
      settlementExplorerUrl?: string;
      settlementMode?: "ua" | "demo";
    }
  ) {
    return apiFetch<{ request: CareRequest; payment?: PaymentRecord }>(`/api/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ action, settlement }),
    });
  },

  saveRule(rule: AllowanceRule) {
    return apiFetch<{ rule: AllowanceRule }>("/api/rules", {
      method: "POST",
      body: JSON.stringify(rule),
    });
  },

  patchRule(
    id: string,
    body: {
      rule?: Partial<AllowanceRule>;
      action?: "toggle" | "execute";
      settlement?: {
        settlementRef?: string;
        settlementExplorerUrl?: string;
        settlementMode?: "ua" | "demo";
      };
    }
  ) {
    return apiFetch<{ rule: AllowanceRule; payment?: PaymentRecord }>(`/api/rules/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  deleteRule(id: string) {
    return apiFetch<{ rules: AllowanceRule[] }>(`/api/rules/${id}`, { method: "DELETE" });
  },

  createPayment(input: {
    memberId: string;
    needType: NeedType;
    amount: number;
    label?: string;
    type?: PaymentRecord["type"];
    settlementRef?: string;
    settlementExplorerUrl?: string;
    settlementMode?: "ua" | "demo";
  }) {
    return apiFetch<{ payment: PaymentRecord }>("/api/payments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getPortalMember(token: string, memberId: string) {
    return apiFetch<{ member: FamilyMember }>(
      `/api/portal/member?token=${encodeURIComponent(token)}&member=${encodeURIComponent(memberId)}`
    );
  },

  createPortalRequest(input: {
    token: string;
    memberId: string;
    needType: NeedType;
    title: string;
    message: string;
    amount: number;
    dueLabel: string;
    billNote: string;
  }) {
    return apiFetch<{ request: CareRequest }>("/api/portal/requests", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};