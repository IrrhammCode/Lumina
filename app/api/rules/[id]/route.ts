import type { NextRequest } from "next/server";
import type { AllowanceRule } from "@/lib/allowances";
import { computeNextRunAt } from "@/lib/allowances";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { deleteRule, getUserData, upsertRule } from "@/lib/server/user-data";
import { verifyAndRecordSettlement } from "@/lib/server/settlements";

type Params = { params: Promise<{ id: string }> };

type PatchBody = {
  rule?: Partial<AllowanceRule>;
  action?: "toggle" | "execute";
  settlement?: {
    settlementRef?: string;
    settlementExplorerUrl?: string;
    settlementMode?: "ua" | "demo" | "magic";
    txHash?: string;
  };
};

export async function GET(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const { id } = await params;
  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  const rule = user.rules.find((r) => r.id === id);
  if (!rule) return jsonError("Rule not found", 404);

  return jsonOk({ rule });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const { id } = await params;
  const body = await parseJsonBody<PatchBody>(request);
  const user = await getUserData(session.sub);
  if (!user) return jsonError("User not found", 404);

  const existing = user.rules.find((r) => r.id === id);
  if (!existing) return jsonError("Rule not found", 404);

  if (body?.action === "toggle") {
    const rule: AllowanceRule = {
      ...existing,
      status: existing.status === "active" ? "paused" : "active",
    };
    await upsertRule(session.sub, rule);
    return jsonOk({ rule });
  }

  if (body?.action === "execute") {
    if (!body.settlement?.settlementRef) {
      return jsonError("On-chain settlement is required");
    }

    const mode = body.settlement.settlementMode ?? "magic";
    const result = await verifyAndRecordSettlement(session.sub, {
      ruleId: existing.id,
      memberId: existing.memberId,
      needType: existing.needType,
      kind: "auto",
      amount: existing.amount,
      settlementRef: body.settlement.settlementRef,
      explorerUrl: body.settlement.settlementExplorerUrl,
      settlementMode: mode,
      txHash:
        body.settlement.txHash ??
        (mode === "magic" ? body.settlement.settlementRef : undefined),
    });

    if (result.status === "failed") {
      return jsonError(result.reason ?? "Settlement verification failed", 400);
    }

    const rule: AllowanceRule = {
      ...existing,
      lastRunAt: result.payment?.date ?? new Date().toISOString(),
      nextRunAt: computeNextRunAt(existing.schedule),
    };
    await upsertRule(session.sub, rule);

    return jsonOk({ rule, payment: result.payment, status: result.status });
  }

  if (body?.rule) {
    const rule: AllowanceRule = { ...existing, ...body.rule, id: existing.id };
    await upsertRule(session.sub, rule);
    return jsonOk({ rule });
  }

  return jsonError("Nothing to update");
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const { id } = await params;
  const updated = await deleteRule(session.sub, id);
  if (!updated) return jsonError("User not found", 404);

  return jsonOk({ rules: updated.rules });
}