import type { AllowanceRule } from "@/lib/allowances";

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function firstOfNextMonth(from = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1, 9, 0, 0, 0);
}

export function computeNextRunAt(schedule: AllowanceRule["schedule"], from = new Date()): string {
  if (schedule.type === "weekly") {
    const target = schedule.dayOfWeek ?? 1;
    const d = new Date(from);
    const diff = (target - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  }
  if (schedule.type === "monthly") {
    return firstOfNextMonth(from).toISOString();
  }
  if (schedule.type === "before_due") {
    return addDays(from, schedule.daysBeforeDue ?? 3).toISOString();
  }
  if (schedule.type === "once" && schedule.onceDate) {
    return new Date(schedule.onceDate).toISOString();
  }
  return addDays(from, 7).toISOString();
}

export function isRuleDue(rule: AllowanceRule, now = new Date()): boolean {
  if (rule.status !== "active") return false;
  return new Date(rule.nextRunAt).getTime() <= now.getTime();
}