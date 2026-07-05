"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Calendar, CalendarDays, Clock } from "lucide-react";
import WizardShell from "@/components/WizardShell";
import MemberAvatar from "@/components/MemberAvatar";
import NeedIcon from "@/components/NeedIcon";
import PageLoading from "@/components/PageLoading";
import BiometricPrompt from "@/components/BiometricPrompt";
import FeeSavings from "@/components/FeeSavings";
import { getStoredUser } from "@/lib/auth";
import { getFamily, type FamilyMember } from "@/lib/family";
import {
  NEED_META,
  createRule,
  upsertRule,
  formatScheduleInput,
  formatNextRun,
  computeNextRunAt,
  type AllowanceRule,
  type NeedType,
  type ScheduleType,
} from "@/lib/allowances";
import FlowSuccessPanel from "@/components/FlowSuccessPanel";
import { slideForward, slideBack } from "@/lib/motion";
import { autopilot, actions, send, fees } from "@/lib/copy";

type Step = "who" | "what" | "when" | "review" | "done";

const NEED_TYPES = Object.keys(NEED_META) as NeedType[];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function NewRuleFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("who");
  const [search, setSearch] = useState("");
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [needType, setNeedType] = useState<NeedType | null>(null);
  const [amount, setAmount] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [daysBeforeDue, setDaysBeforeDue] = useState(3);
  const [showBio, setShowBio] = useState(false);
  const [createdRule, setCreatedRule] = useState<AllowanceRule | null>(null);

  const family = getFamily().filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.relation.toLowerCase().includes(search.toLowerCase())
  );

  const stepIndex = { who: 0, what: 1, when: 2, review: 3, done: 4 }[step];
  const numAmount = parseFloat(amount) || 0;

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    const preNeed = searchParams.get("need") as NeedType | null;
    if (preNeed && NEED_META[preNeed]) setNeedType(preNeed);
    setReady(true);
  }, [router, searchParams]);

  const goBack = () => {
    if (step === "done") {
      router.push("/dashboard");
      return;
    }
    const prev: Record<Step, Step | "exit"> = {
      who: "exit",
      what: "who",
      when: "what",
      review: "when",
      done: "exit",
    };
    const p = prev[step];
    if (p === "exit") router.back();
    else setStep(p);
  };

  const onActivate = () => {
    if (!member || !needType || numAmount <= 0) return;
    setShowBio(true);
  };

  const onBioConfirm = () => {
    if (!member || !needType) return;
    const rule = createRule({
      memberId: member.id,
      needType,
      amount: numAmount,
      schedule: {
        type: scheduleType,
        dayOfWeek: scheduleType === "weekly" ? dayOfWeek : undefined,
        dayOfMonth: scheduleType === "monthly" ? dayOfMonth : undefined,
        daysBeforeDue: scheduleType === "before_due" ? daysBeforeDue : undefined,
      },
    });
    upsertRule(rule);
    setCreatedRule(rule);
    setShowBio(false);
    setStep("done");
  };

  if (!ready) return <PageLoading />;

  const schedulePreview = {
    type: scheduleType,
    dayOfWeek: scheduleType === "weekly" ? dayOfWeek : undefined,
    dayOfMonth: scheduleType === "monthly" ? dayOfMonth : undefined,
    daysBeforeDue: scheduleType === "before_due" ? daysBeforeDue : undefined,
  };

  const subtitles: Record<Exclude<Step, "done">, string> = {
    who: autopilot.wizard.whoSub,
    what: autopilot.wizard.whatSub,
    when: autopilot.wizard.whenSub,
    review: autopilot.wizard.reviewSub,
  };

  const footer =
    step === "what" ? (
      <button
        type="button"
        onClick={() => setStep("when")}
        disabled={!needType || numAmount <= 0}
        className="btn-primary"
      >
        {actions.continue}
      </button>
    ) : step === "when" ? (
      <button type="button" onClick={() => setStep("review")} className="btn-primary">
        {actions.continue}
      </button>
    ) : step === "review" ? (
      <button type="button" onClick={onActivate} className="btn-primary">
        {autopilot.activate}
      </button>
    ) : undefined;

  return (
    <>
      <WizardShell
        title={step === "done" ? autopilot.wizard.doneTitle : autopilot.newTitle}
        subtitle={step === "done" ? undefined : subtitles[step]}
        step={Math.min(stepIndex, 3)}
        stepLabels={autopilot.wizard.steps}
        onBack={goBack}
        footer={footer}
        hideSteps={step === "done"}
        panel={step === "review"}
        theme="autopilot"
        autopilotBrandLabel={autopilot.brand}
      >
        <AnimatePresence mode="wait">
          {step === "who" && (
            <motion.div key="who" variants={slideBack} initial="initial" animate="animate" exit="exit" className="space-y-4">
              <p className="flow-lead">{autopilot.wizard.who}</p>
              <div className="auto-search-box">
                <Search size={16} className="auto-search-icon" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={send.searchPh}
                  className="auto-search-input"
                />
              </div>
              <p className="auto-pick-label">{autopilot.pickMember}</p>
              <div className="auto-member-grid">
                {family.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setMember(m); setStep("what"); }}
                    className="auto-member-card"
                  >
                    <MemberAvatar code={m.countryCode} size="lg" />
                    <p className="auto-member-name">{m.name}</p>
                    <p className="auto-member-meta">{m.relation}</p>
                    <p className="auto-member-payout">{m.method}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "what" && member && (
            <motion.div key="what" variants={slideForward} initial="initial" animate="animate" exit="exit" className="space-y-5">
              <div className="auto-member-hero">
                <MemberAvatar code={member.countryCode} size="md" />
                <div>
                  <p className="auto-member-hero-name">{member.name}</p>
                  <p className="auto-member-hero-sub">
                    {member.relation} · {member.country}
                  </p>
                </div>
              </div>

              <div>
                <p className="flow-lead">{autopilot.wizard.what}</p>
                <div className="grid grid-cols-3 gap-2 need-grid--auto">
                  {NEED_TYPES.map((n) => {
                    const meta = NEED_META[n];
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNeedType(n)}
                        className={`need-chip need-chip--auto ${needType === n ? "selected" : ""}`}
                        style={
                          needType === n
                            ? { borderColor: meta.accent, background: meta.pale }
                            : undefined
                        }
                      >
                        <NeedIcon type={n} size={22} />
                        <span className="text-xs font-semibold text-ink">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card-bordered auto-amount-card">
                <label className="field-label">{send.amountLabel}</label>
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-2xl font-bold text-mute">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-amount text-3xl flex-1 bg-transparent border-none outline-none min-w-0"
                    inputMode="decimal"
                  />
                </div>
                <p className="auto-amount-hint">{autopilot.amountHint(member.method)}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {["10", "42", "85", "100"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className={`stat-pill ${amount === v ? "!bg-primary !text-on-primary !border-primary" : ""}`}
                  >
                    ${v}
                  </button>
                ))}
              </div>

              <FeeSavings amount={numAmount} />
            </motion.div>
          )}

          {step === "when" && (
            <motion.div key="when" variants={slideForward} initial="initial" animate="animate" exit="exit" className="space-y-4">
              <p className="flow-lead">{autopilot.schedule.whenTitle}</p>

              <div className="auto-schedule-panel">
              <button type="button" onClick={() => setScheduleType("weekly")} className={`schedule-option schedule-option--auto ${scheduleType === "weekly" ? "selected" : ""}`}>
                <Calendar size={20} className="text-glow" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{autopilot.schedule.weekly}</p>
                  <p className="text-caption text-xs">{autopilot.schedule.weeklySub}</p>
                </div>
              </button>

              {scheduleType === "weekly" && (
                <div className="flex gap-1.5 flex-wrap px-1">
                  {DAYS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDayOfWeek(i)}
                      className={`stat-pill min-w-[2.5rem] justify-center ${dayOfWeek === i ? "!bg-primary !text-on-primary !border-primary" : ""}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => setScheduleType("monthly")} className={`schedule-option schedule-option--auto ${scheduleType === "monthly" ? "selected" : ""}`}>
                <CalendarDays size={20} className="text-glow" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{autopilot.schedule.monthly}</p>
                  <p className="text-caption text-xs">{autopilot.schedule.monthlySub}</p>
                </div>
              </button>

              {scheduleType === "monthly" && (
                <div className="flex gap-1.5 flex-wrap px-1">
                  {[1, 5, 15, 28].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDayOfMonth(d)}
                      className={`stat-pill ${dayOfMonth === d ? "!bg-primary !text-on-primary !border-primary" : ""}`}
                    >
                      {d}{d === 1 ? "st" : "th"}
                    </button>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => setScheduleType("before_due")} className={`schedule-option schedule-option--auto ${scheduleType === "before_due" ? "selected" : ""}`}>
                <Clock size={20} className="text-glow" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{autopilot.schedule.beforeDue}</p>
                  <p className="text-caption text-xs">{autopilot.schedule.beforeDueSub}</p>
                </div>
              </button>

              {scheduleType === "before_due" && (
                <div className="flex gap-2 px-1">
                  {[1, 3, 5, 7].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDaysBeforeDue(d)}
                      className={`stat-pill ${daysBeforeDue === d ? "!bg-primary !text-on-primary !border-primary" : ""}`}
                    >
                      {autopilot.schedule.daysBefore(d)}
                    </button>
                  ))}
                </div>
              )}
              </div>
            </motion.div>
          )}

          {step === "review" && member && needType && (
            <motion.div key="review" variants={slideForward} initial="initial" animate="animate" exit="exit" className="space-y-4">
              <div className="card-bordered space-y-4 auto-review-card">
                <p className="auto-review-eyebrow">{autopilot.reviewEyebrow}</p>
                <div className="flex items-center gap-3">
                  <NeedIcon type={needType} variant="tile" size={20} />
                  <div>
                    <p className="text-sm font-bold text-ink">{NEED_META[needType].label} for {member.relation}</p>
                    <p className="text-caption text-xs">{member.name}</p>
                  </div>
                </div>
                <div className="h-px bg-border-soft" />
                <div className="auto-review-total">
                  <span className="text-caption text-sm">{autopilot.detail.amount}</span>
                  <span className="auto-review-amount">${numAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption text-sm">{autopilot.detail.schedule}</span>
                  <span className="text-sm font-semibold">{formatScheduleInput(schedulePreview)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption text-sm">{autopilot.detail.fee}</span>
                  <span className="badge-savings">{fees.free}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption text-sm">{autopilot.detail.yearly}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    ${(numAmount * (scheduleType === "weekly" ? 52 : scheduleType === "monthly" ? 12 : 12)).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption text-sm">{autopilot.detail.nextRun}</span>
                  <span className="text-sm font-semibold">
                    {formatNextRun(computeNextRunAt(schedulePreview))}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {step === "done" && member && needType && createdRule && (
            <FlowSuccessPanel
              key="done"
              title={autopilot.wizard.doneTitle}
              body={autopilot.wizard.doneBody(member.relation)}
              hint={autopilot.detail.sentBody(member.relation)}
              panel
              meta={[
                { label: autopilot.detail.schedule, value: formatScheduleInput(createdRule.schedule) },
                { label: autopilot.wizard.firstRun, value: formatNextRun(createdRule.nextRunAt) },
                { label: autopilot.detail.amount, value: `$${createdRule.amount.toFixed(2)}` },
              ]}
              actions={[
                { label: autopilot.detail.backHome, onClick: () => router.push("/dashboard") },
                { label: autopilot.wizard.viewRules, onClick: () => router.push("/rules"), variant: "secondary" },
              ]}
            />
          )}
        </AnimatePresence>
      </WizardShell>

      <BiometricPrompt
        isOpen={showBio}
        onConfirm={onBioConfirm}
        onCancel={() => setShowBio(false)}
        context="activate"
        amount={`$${numAmount.toFixed(2)}`}
        recipient={member ? `${NEED_META[needType!].label} for ${member.relation}` : undefined}
      />
    </>
  );
}

export default function NewRulePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <NewRuleFlow />
    </Suspense>
  );
}