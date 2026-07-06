import type { NextRequest } from "next/server";
import type { AllowanceRule, PaymentRecord } from "@/lib/allowances";
import { computeNextRunAt } from "@/lib/allowances";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { addPayment, deleteRule, getUserData, upsertRule } from "@/lib/server/user-data";

type Params = { params: Promise<{ id: string }> };

type PatchBody = {
  rule?: Partial<AllowanceRule>;
  action?: "toggle" | "execute";
  settlement?: {
    settlementRef?: string;
    settlementExplorerUrl?: string;
    settlementMode?: "ua" | "demo";
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
    const member = user.family.find((m) => m.id === existing.memberId);
    if (!member) return jsonError("Member not found", 404);

    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      ruleId: existing.id,
      ruleLabel: existing.label,
      memberId: member.id,
      memberName: member.name,
      countryCode: member.countryCode,
      needType: existing.needType,
      amount: existing.amount,
      type: "auto",
      status: "completed",
      date: new Date().toISOString(),
      settlementRef: body.settlement?.settlementRef ?? `0x${Math.random().toString(16).slice(2, 10)}…arb`,
      settlementExplorerUrl: body.settlement?.settlementExplorerUrl,
      settlementMode: body.settlement?.settlementMode ?? (body.settlement?.settlementExplorerUrl ? "ua" : "demo"),
    };

    await addPayment(session.sub, payment);

    const rule: AllowanceRule = {
      ...existing,
      lastRunAt: payment.date,
      nextRunAt: computeNextRunAt(existing.schedule),
    };
    await upsertRule(session.sub, rule);

    return jsonOk({ rule, payment });
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