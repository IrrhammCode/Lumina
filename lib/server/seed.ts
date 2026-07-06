import type { AllowanceRule, PaymentRecord } from "@/lib/allowances";
import type { CareRequest } from "@/lib/requests";
import { defaultFamily } from "@/lib/family";
import type { UserRecord } from "./types";

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function nextMonday(from = new Date()): Date {
  const d = new Date(from);
  const day = d.getDay();
  const diff = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(9, 0, 0, 0);
  return d;
}

function firstOfNextMonth(from = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1, 9, 0, 0, 0);
}

export function buildDemoSeed(): Pick<UserRecord, "family" | "requests" | "rules" | "payments" | "seeded"> {
  const now = new Date();
  const friday = addDays(now, 3);
  const dueStr = friday.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const requests: CareRequest[] = [
    {
      id: "req_demo_1",
      memberId: "2",
      needType: "school",
      title: "School fee — Q3 tuition",
      message: "Hi ate, school fee is due this Friday. Can you help with tuition?",
      amount: 85,
      dueLabel: dueStr,
      billNote: "SMAN 3 Manila · Quarter 3 tuition",
      status: "pending",
      source: "family",
      createdAt: addDays(now, -0.5).toISOString(),
    },
    {
      id: "req_demo_2",
      memberId: "1",
      needType: "electricity",
      title: "Meralco bill — July",
      message: "Electric bill arrived. Due in 5 days.",
      amount: 38,
      dueLabel: addDays(now, 5).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      billNote: "Meralco · Account ***4821",
      status: "pending",
      source: "family",
      createdAt: addDays(now, -1).toISOString(),
    },
  ];

  const rules: AllowanceRule[] = [
    {
      id: "rule_demo_1",
      memberId: "1",
      needType: "pulsa",
      label: "Pulsa for Mom",
      amount: 10,
      schedule: { type: "weekly", dayOfWeek: 1 },
      status: "active",
      lastRunAt: addDays(now, -6).toISOString(),
      nextRunAt: nextMonday(now).toISOString(),
      createdAt: addDays(now, -30).toISOString(),
    },
    {
      id: "rule_demo_2",
      memberId: "1",
      needType: "electricity",
      label: "Electricity for Mom",
      amount: 42,
      schedule: { type: "before_due", daysBeforeDue: 3 },
      status: "active",
      lastRunAt: addDays(now, -12).toISOString(),
      nextRunAt: addDays(now, 4).toISOString(),
      createdAt: addDays(now, -45).toISOString(),
    },
    {
      id: "rule_demo_3",
      memberId: "2",
      needType: "school",
      label: "School for Brother",
      amount: 85,
      schedule: { type: "monthly", dayOfMonth: 1 },
      status: "active",
      lastRunAt: addDays(now, -20).toISOString(),
      nextRunAt: firstOfNextMonth(now).toISOString(),
      createdAt: addDays(now, -60).toISOString(),
    },
  ];

  const payments: PaymentRecord[] = [
    {
      id: "pay_demo_1",
      ruleId: "rule_demo_1",
      ruleLabel: "Pulsa for Mom",
      memberId: "1",
      memberName: "Maria Santos",
      countryCode: "PH",
      needType: "pulsa",
      amount: 10,
      type: "auto",
      status: "completed",
      date: addDays(now, -6).toISOString(),
      settlementRef: "0x8a3f2b1c…arb",
    },
    {
      id: "pay_demo_2",
      ruleId: "rule_demo_2",
      ruleLabel: "Electricity for Mom",
      memberId: "1",
      memberName: "Maria Santos",
      countryCode: "PH",
      needType: "electricity",
      amount: 42,
      type: "auto",
      status: "completed",
      date: addDays(now, -12).toISOString(),
      settlementRef: "0x4d9e7f2a…arb",
    },
    {
      id: "pay_demo_3",
      ruleId: "rule_demo_3",
      ruleLabel: "School for Brother",
      memberId: "2",
      memberName: "Juan Santos",
      countryCode: "PH",
      needType: "school",
      amount: 85,
      type: "auto",
      status: "completed",
      date: addDays(now, -20).toISOString(),
      settlementRef: "0x1c8b5e3d…arb",
    },
  ];

  return {
    family: defaultFamily,
    requests,
    rules,
    payments,
    seeded: true,
  };
}