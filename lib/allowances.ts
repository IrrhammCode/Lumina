import { api } from "./api-client";
import { isLoggedIn } from "./auth";
import { confirmSettlementAfterPay } from "./settlement-poll";
import type { PaymentSettlementFields } from "./settlement";
import { hydrateFromServer, isServerBacked } from "./sync";

import { getMemberById, type FamilyMember } from "./family";
import { normalizeCountryCode } from "./countries";

export type NeedType = "pulsa" | "electricity" | "school" | "health" | "rent" | "custom";
export type ScheduleType = "weekly" | "monthly" | "before_due" | "once";
export type RuleStatus = "active" | "paused";

export type AllowanceRule = {
  id: string;
  memberId: string;
  needType: NeedType;
  label: string;
  amount: number;
  schedule: {
    type: ScheduleType;
    dayOfWeek?: number;
    dayOfMonth?: number;
    daysBeforeDue?: number;
    onceDate?: string;
  };
  status: RuleStatus;
  lastRunAt?: string;
  nextRunAt: string;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  ruleId?: string;
  requestId?: string;
  ruleLabel?: string;
  memberId: string;
  memberName: string;
  countryCode: string;
  needType: NeedType;
  amount: number;
  type: "auto" | "manual" | "pull";
  status: "completed" | "pending" | "failed";
  date: string;
  settlementRef?: string;
  settlementExplorerUrl?: string;
  settlementMode?: "ua" | "demo" | "magic";
};

export const NEED_META: Record<
  NeedType,
  { label: string; accent: string; pale: string }
> = {
  pulsa: { label: "Pulsa", accent: "#8B7CF6", pale: "#EDE9FE" },
  electricity: { label: "Electricity", accent: "#F59E0B", pale: "#FEF3C7" },
  school: { label: "School", accent: "#3B82F6", pale: "#DBEAFE" },
  health: { label: "Health", accent: "#EF4444", pale: "#FEE2E2" },
  rent: { label: "Rent", accent: "#10B981", pale: "#D1FAE5" },
  custom: { label: "Custom", accent: "#868685", pale: "#F3F4F2" },
};

const RULES_KEY = "lumina_rules";
const PAYMENTS_KEY = "lumina_payments";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function firstOfNextMonth(from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth() + 1, 1, 9, 0, 0, 0);
  return d;
}

export function formatScheduleInput(schedule: AllowanceRule["schedule"]): string {
  if (schedule.type === "weekly" && schedule.dayOfWeek !== undefined) {
    return `Every ${DAYS[schedule.dayOfWeek]}`;
  }
  if (schedule.type === "monthly" && schedule.dayOfMonth) {
    const suffix =
      schedule.dayOfMonth === 1 ? "st" : schedule.dayOfMonth === 2 ? "nd" : schedule.dayOfMonth === 3 ? "rd" : "th";
    return `${schedule.dayOfMonth}${suffix} of each month`;
  }
  if (schedule.type === "before_due" && schedule.daysBeforeDue) {
    return `${schedule.daysBeforeDue} days before due`;
  }
  if (schedule.type === "once" && schedule.onceDate) {
    return `Once on ${new Date(schedule.onceDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  return "Scheduled";
}

export function formatSchedule(rule: AllowanceRule): string {
  return formatScheduleInput(rule.schedule);
}

export function formatNextRun(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dateStr = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return `In ${diffDays} days · ${dateStr}`;
  return dateStr;
}

export function getRules(): AllowanceRule[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RULES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AllowanceRule[];
  } catch {
    return [];
  }
}

export function saveRules(rules: AllowanceRule[]): void {
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

export function getRuleById(id: string): AllowanceRule | undefined {
  return getRules().find((r) => r.id === id);
}

export function upsertRule(rule: AllowanceRule, options?: { sync?: boolean }): void {
  const rules = getRules();
  const idx = rules.findIndex((r) => r.id === rule.id);
  if (idx >= 0) rules[idx] = rule;
  else rules.push(rule);
  saveRules(rules);
  if (isLoggedIn() && options?.sync !== false) void api.saveRule(rule);
}

export function deleteRule(id: string): void {
  saveRules(getRules().filter((r) => r.id !== id));
  if (isLoggedIn()) void api.deleteRule(id);
}

export function toggleRuleStatus(id: string): void {
  const rules = getRules().map((r) =>
    r.id === id ? { ...r, status: r.status === "active" ? "paused" : "active" } as AllowanceRule : r
  );
  saveRules(rules);
  if (isLoggedIn()) void api.patchRule(id, { action: "toggle" });
}

function migratePayment(raw: Record<string, unknown>): PaymentRecord {
  const legacy = raw.flag as string | undefined;
  const countryCode = raw.countryCode
    ? normalizeCountryCode(String(raw.countryCode))
    : legacy
      ? normalizeCountryCode(legacy)
      : "XX";

  return {
    ...(raw as unknown as PaymentRecord),
    countryCode,
  };
}

export function getPayments(): PaymentRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PAYMENTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return parsed.map(migratePayment);
  } catch {
    return [];
  }
}

export function addPayment(payment: PaymentRecord): void {
  const payments = [payment, ...getPayments()];
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
}

export function getPaymentById(id: string): PaymentRecord | undefined {
  return getPayments().find((p) => p.id === id);
}

export function getPaymentByRequestId(requestId: string): PaymentRecord | undefined {
  return getPayments().find((p) => p.requestId === requestId);
}

export async function createManualPayment(input: {
  memberId: string;
  needType: NeedType;
  amount: number;
  label?: string;
  settlementRef?: string;
  settlementExplorerUrl?: string;
  settlementMode?: "ua" | "demo" | "magic";
  uaTransactionId?: string;
  txHash?: string;
}): Promise<PaymentRecord | null> {
  const member = getMemberById(input.memberId);
  if (!member) return null;

  if (isLoggedIn()) {
    const result = await confirmSettlementAfterPay({
      memberId: member.id,
      needType: input.needType,
      amount: input.amount,
      kind: "manual",
      settlement: {
        settlementRef: input.settlementRef ?? "",
        settlementExplorerUrl: input.settlementExplorerUrl,
        settlementMode: input.settlementMode ?? "ua",
        uaTransactionId: input.uaTransactionId,
        txHash: input.txHash,
      },
    });
    if (!result.ok) return null;
    return result.payment ?? getPayments()[0] ?? null;
  }

  const payment: PaymentRecord = {
    id: `pay_${Date.now()}`,
    ruleLabel: input.label ?? `${NEED_META[input.needType].label} for ${member.relation}`,
    memberId: member.id,
    memberName: member.name,
    countryCode: member.countryCode,
    needType: input.needType,
    amount: input.amount,
    type: "manual",
    status: "completed",
    date: new Date().toISOString(),
    settlementRef: input.settlementRef ?? "",
    settlementExplorerUrl: input.settlementExplorerUrl,
    settlementMode: input.settlementMode ?? "magic",
  };

  if (!payment.settlementRef) return null;
  addPayment(payment);
  return payment;
}

export function getNextRule(): AllowanceRule | undefined {
  return getRules()
    .filter((r) => r.status === "active")
    .sort((a, b) => new Date(a.nextRunAt).getTime() - new Date(b.nextRunAt).getTime())[0];
}

export function getMonthStats(): { total: number; count: number } {
  const now = new Date();
  const payments = getPayments().filter((p) => {
    const d = new Date(p.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && p.status === "completed";
  });
  return {
    total: payments.reduce((s, p) => s + p.amount, 0),
    count: payments.length,
  };
}

export function buildRuleLabel(needType: NeedType, member: FamilyMember): string {
  const meta = NEED_META[needType];
  return `${meta.label} for ${member.relation}`;
}

export function computeNextRunAt(schedule: AllowanceRule["schedule"]): string {
  const now = new Date();
  if (schedule.type === "weekly") {
    const target = schedule.dayOfWeek ?? 1;
    const d = new Date(now);
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  if (schedule.type === "monthly") {
    return firstOfNextMonth(now).toISOString();
  }
  if (schedule.type === "before_due") {
    return addDays(now, schedule.daysBeforeDue ?? 3).toISOString();
  }
  if (schedule.type === "once" && schedule.onceDate) {
    return new Date(schedule.onceDate).toISOString();
  }
  return addDays(now, 7).toISOString();
}

export function createRule(input: {
  memberId: string;
  needType: NeedType;
  amount: number;
  schedule: AllowanceRule["schedule"];
}): AllowanceRule {
  const member = getMemberById(input.memberId);
  if (!member) throw new Error("Member not found");

  return {
    id: `rule_${Date.now()}`,
    memberId: input.memberId,
    needType: input.needType,
    label: buildRuleLabel(input.needType, member),
    amount: input.amount,
    schedule: input.schedule,
    status: "active",
    nextRunAt: computeNextRunAt(input.schedule),
    createdAt: new Date().toISOString(),
  };
}

export async function executeRule(
  ruleId: string,
  settlement: PaymentSettlementFields
): Promise<PaymentRecord | null> {
  const rule = getRuleById(ruleId);
  const member = rule ? getMemberById(rule.memberId) : undefined;
  if (!rule || !member) return null;

  if (isLoggedIn()) {
    const result = await confirmSettlementAfterPay({
      ruleId: rule.id,
      memberId: member.id,
      needType: rule.needType,
      amount: rule.amount,
      kind: "auto",
      settlement,
    });
    if (!result.ok) return null;
    return (
      result.payment ??
      getPayments().find((p) => p.ruleId === ruleId && p.status === "completed") ??
      null
    );
  }

  const payment: PaymentRecord = {
    id: `pay_${Date.now()}`,
    ruleId: rule.id,
    ruleLabel: rule.label,
    memberId: member.id,
    memberName: member.name,
    countryCode: member.countryCode,
    needType: rule.needType,
    amount: rule.amount,
    type: "auto",
    status: "completed",
    date: new Date().toISOString(),
    settlementRef: settlement.settlementRef,
    settlementExplorerUrl: settlement.settlementExplorerUrl,
    settlementMode: settlement.settlementMode,
  };

  addPayment(payment);

  const updated: AllowanceRule = {
    ...rule,
    lastRunAt: payment.date,
    nextRunAt: computeNextRunAt(rule.schedule),
  };
  upsertRule(updated, { sync: false });

  return payment;
}

