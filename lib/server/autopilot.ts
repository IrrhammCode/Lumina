import type { AllowanceRule, PaymentRecord } from "@/lib/allowances";
import { getUserById, listAllUsers } from "./db";
import { addPayment, upsertRule } from "./user-data";
import { computeNextRunAt, isRuleDue } from "./schedule";
import { verifyAndRecordSettlement } from "./settlements";
import { allowDemoSettlement } from "./settlement-verify";
import type { UserRecord } from "./types";

export type AutopilotSweepResult = {
  usersScanned: number;
  dueFound: number;
  completed: number;
  queued: number;
  skipped: number;
  errors: string[];
};

function hasPendingAutopilotPayment(user: UserRecord, ruleId: string): boolean {
  return user.payments.some(
    (p) => p.ruleId === ruleId && p.type === "auto" && p.status === "pending"
  );
}

function advanceRuleAfterRun(rule: AllowanceRule, ranAt: string): AllowanceRule {
  const onceDone = rule.schedule.type === "once";
  return {
    ...rule,
    lastRunAt: ranAt,
    nextRunAt: computeNextRunAt(rule.schedule, new Date(ranAt)),
    status: onceDone ? "paused" : rule.status,
  };
}

async function executeDueRule(
  user: UserRecord,
  rule: AllowanceRule
): Promise<"completed" | "queued" | "skipped"> {
  if (!isRuleDue(rule)) return "skipped";
  if (hasPendingAutopilotPayment(user, rule.id)) return "skipped";

  const member = user.family.find((m) => m.id === rule.memberId);
  if (!member) return "skipped";

  const ranAt = new Date().toISOString();
  const updatedRule = advanceRuleAfterRun(rule, ranAt);

  if (allowDemoSettlement()) {
    const result = await verifyAndRecordSettlement(user.id, {
      ruleId: rule.id,
      memberId: member.id,
      needType: rule.needType,
      kind: "auto",
      amount: rule.amount,
      settlementRef: `auto:${rule.id}:${Date.now()}`,
      settlementMode: "demo",
    });
    if (result.status === "verified") {
      await upsertRule(user.id, updatedRule);
      return "completed";
    }
    return "skipped";
  }

  const payment: PaymentRecord = {
    id: `pay_${Date.now()}_${rule.id.slice(-4)}`,
    ruleId: rule.id,
    ruleLabel: rule.label,
    memberId: member.id,
    memberName: member.name,
    countryCode: member.countryCode,
    needType: rule.needType,
    amount: rule.amount,
    type: "auto",
    status: "pending",
    date: ranAt,
    settlementRef: `auto:pending:${rule.id}`,
    settlementMode: "ua",
  };

  await addPayment(user.id, payment);
  await upsertRule(user.id, updatedRule);
  return "queued";
}

export async function runAutopilotForUser(userId: string): Promise<AutopilotSweepResult> {
  const user = await getUserById(userId);
  if (!user) {
    return {
      usersScanned: 0,
      dueFound: 0,
      completed: 0,
      queued: 0,
      skipped: 0,
      errors: ["User not found"],
    };
  }
  return runAutopilotForUsers([user]);
}

export async function runAutopilotSweep(): Promise<AutopilotSweepResult> {
  const users = await listAllUsers();
  return runAutopilotForUsers(users);
}

async function runAutopilotForUsers(users: UserRecord[]): Promise<AutopilotSweepResult> {
  const result: AutopilotSweepResult = {
    usersScanned: users.length,
    dueFound: 0,
    completed: 0,
    queued: 0,
    skipped: 0,
    errors: [],
  };

  for (const user of users) {
    const dueRules = user.rules.filter((r) => isRuleDue(r));
    result.dueFound += dueRules.length;

    for (const rule of dueRules) {
      try {
        const fresh = await getUserById(user.id);
        if (!fresh) continue;
        const outcome = await executeDueRule(fresh, rule);
        if (outcome === "completed") result.completed += 1;
        else if (outcome === "queued") result.queued += 1;
        else result.skipped += 1;
      } catch (error) {
        result.errors.push(
          `${user.id}/${rule.id}: ${error instanceof Error ? error.message : "unknown"}`
        );
      }
    }
  }

  return result;
}

export function getPendingAutopilotPayments(user: UserRecord): PaymentRecord[] {
  return user.payments.filter((p) => p.type === "auto" && p.status === "pending");
}