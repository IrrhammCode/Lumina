"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import FlowSuccessPanel from "@/components/FlowSuccessPanel";
import WizardShell from "@/components/WizardShell";
import MemberAvatar from "@/components/MemberAvatar";
import NeedIcon from "@/components/NeedIcon";
import PageLoading from "@/components/PageLoading";
import FeeSavings from "@/components/FeeSavings";
import { getStoredUser } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { getFamily, getMemberById, type FamilyMember } from "@/lib/family";
import { NEED_META, type NeedType } from "@/lib/allowances";
import {
  createRequest,
  buildRequestTitle,
  formatDueFromDays,
  defaultRequestMessage,
  type RequestSource,
} from "@/lib/requests";
import { slideForward, slideBack } from "@/lib/motion";
import { ask, requestLog, actions, send, pull } from "@/lib/copy";

type Step = "who" | "what" | "details" | "review" | "done";

const NEED_TYPES = Object.keys(NEED_META) as NeedType[];

const DUE_OPTIONS = [
  { days: 3, label: "3 days" },
  { days: 5, label: "5 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
];

type RequestWizardProps = {
  mode: RequestSource;
};

export default function RequestWizard({ mode }: RequestWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFamily = mode === "family";
  const copy = isFamily ? ask : requestLog;

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("who");
  const [skippedWho, setSkippedWho] = useState(false);
  const [search, setSearch] = useState("");
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [needType, setNeedType] = useState<NeedType>("school");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [billNote, setBillNote] = useState("");
  const [dueDays, setDueDays] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [portalCap, setPortalCap] = useState<string | null>(null);
  const [portalSig, setPortalSig] = useState<string | null>(null);

  const family = getFamily().filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.relation.toLowerCase().includes(search.toLowerCase())
  );

  const numAmount = parseFloat(amount) || 0;
  const stepIndex = { who: 0, what: 1, details: 2, review: 3, done: 4 }[step];
  const dueLabel = formatDueFromDays(dueDays);

  useEffect(() => {
    if (!isFamily && !getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    if (isFamily) {
      const memberId = searchParams.get("member");
      const token = searchParams.get("token");
      const cap = searchParams.get("cap");
      const sig = searchParams.get("sig");
      if (token) setPortalToken(token);
      if (cap) setPortalCap(cap);
      if (sig) setPortalSig(sig);

      const applyMember = (m: FamilyMember) => {
        setMember(m);
        setMessage(defaultRequestMessage("school", m.relation));
        setNeedType("school");
        setSkippedWho(true);
        setStep("what");
      };

      if (memberId && (cap && sig || token)) {
        void api
          .getPortalMember({ memberId, token: token ?? undefined, cap: cap ?? undefined, sig: sig ?? undefined })
          .then((res) => {
            if (res.ok) applyMember(res.data.member);
          });
      } else if (memberId) {
        const m = getMemberById(memberId);
        if (m) applyMember(m);
      }
    }
    setReady(true);
  }, [router, isFamily, searchParams]);

  const applyNeedDefaults = (type: NeedType, m: FamilyMember) => {
    setNeedType(type);
    setMessage(defaultRequestMessage(type, m.relation));
  };

  const selectMember = (m: FamilyMember) => {
    setMember(m);
    applyNeedDefaults("school", m);
    setStep("what");
  };

  const goBack = () => {
    const prev: Record<Step, Step | "exit"> = {
      who: "exit",
      what: skippedWho ? "exit" : "who",
      details: "what",
      review: "details",
      done: "exit",
    };
    const p = prev[step];
    if (p === "exit") router.back();
    else setStep(p);
  };

  const onSubmit = async () => {
    if (!member || numAmount <= 0) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    await createRequest({
      memberId: member.id,
      needType,
      title: buildRequestTitle(needType, member.relation, billNote),
      message: message.trim() || defaultRequestMessage(needType, member.relation),
      amount: numAmount,
      dueLabel,
      billNote: billNote.trim(),
      source: mode,
      portalToken: portalToken ?? undefined,
      portalCap: portalCap ?? undefined,
      portalSig: portalSig ?? undefined,
    });
    setSubmitting(false);
    setStep("done");
  };

  if (!ready) return <PageLoading />;

  const subtitles: Record<Exclude<Step, "done">, string> = {
    who: isFamily ? ask.sub : requestLog.sub,
    what: isFamily ? ask.whatSub : requestLog.whatSub,
    details: copy.detailsSub,
    review: copy.reviewSub,
  };

  const footer =
    step === "what" && member ? (
      <button
        type="button"
        onClick={() => setStep("details")}
        disabled={numAmount <= 0}
        className="btn-primary"
      >
        {actions.continue}
      </button>
    ) : step === "details" ? (
      <button type="button" onClick={() => setStep("review")} className="btn-primary">
        {actions.continue}
      </button>
    ) : step === "review" && !submitting ? (
      <button type="button" onClick={onSubmit} className="btn-primary">
        {isFamily ? ask.submit : requestLog.submit}
      </button>
    ) : undefined;

  return (
    <WizardShell
      title={step === "done" ? (isFamily ? ask.successTitle : requestLog.successTitle) : copy.title}
      subtitle={step === "done" ? undefined : subtitles[step]}
      step={Math.min(stepIndex, 3)}
      stepLabels={isFamily ? ask.steps : requestLog.steps}
      onBack={goBack}
      footer={footer}
      hideSteps={step === "done"}
      panel={step === "review"}
      theme={isFamily ? "family" : "log"}
      hideBack={isFamily && step === "who" && !skippedWho}
      familyBrandLabel={ask.brand}
      logBrandLabel={requestLog.brand}
    >
      <AnimatePresence mode="wait">
        {step === "who" && (
          <motion.div
            key="who"
            variants={slideBack}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            <p className="flow-lead">{copy.who}</p>
            {isFamily && !skippedWho && (
              <div className="ask-welcome">
                <p className="ask-welcome-eyebrow">{ask.brand}</p>
                <p className="ask-welcome-title">{ask.welcomeTitle}</p>
                <p className="ask-welcome-sub">{ask.welcomeSub}</p>
              </div>
            )}
            {!isFamily && (
              <div className="log-search-box">
                <Search size={16} className="log-search-icon" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={send.searchPh}
                  className="log-search-input"
                />
              </div>
            )}
            {family.length === 0 ? (
              <EmptyState
                icon={Users}
                title={ask.emptyFamily}
                sub={ask.emptyFamilySub}
              />
            ) : isFamily ? (
              <>
                <p className="ask-pick-label">{ask.pickYou}</p>
                <div className="ask-member-grid">
                  {family.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMember(m)}
                      className="ask-member-card"
                    >
                      <MemberAvatar name={m.name} id={m.id} code={m.countryCode} photoUrl={m.photoUrl} size="lg" />
                      <p className="ask-member-name">{m.name}</p>
                      <p className="ask-member-meta">{m.relation}</p>
                      <p className="ask-member-payout">{m.method}</p>
                    </button>
                  ))}
                </div>
                <p className="ask-trust-strip">{ask.trustStrip}</p>
              </>
            ) : (
              <>
                <p className="log-pick-label">{requestLog.pickMember}</p>
                <div className="log-member-grid">
                  {family.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMember(m)}
                      className="log-member-card"
                    >
                      <MemberAvatar name={m.name} id={m.id} code={m.countryCode} photoUrl={m.photoUrl} size="lg" />
                      <p className="log-member-name">{m.name}</p>
                      <p className="log-member-meta">{m.relation}</p>
                      <p className="log-member-payout">{m.method}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {step === "what" && member && (
          <motion.div
            key="what"
            variants={slideForward}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-5"
          >
            {isFamily && skippedWho ? (
              <div className="ask-hero">
                <MemberAvatar name={member.name} id={member.id} code={member.countryCode} photoUrl={member.photoUrl} size="lg" />
                <div>
                  <p className="ask-hero-greeting">{ask.deepLinkGreeting(member.name)}</p>
                  <p className="ask-hero-sub">{member.relation} · {member.country}</p>
                </div>
              </div>
            ) : (
              <div className="log-member-hero">
                <MemberAvatar name={member.name} id={member.id} code={member.countryCode} photoUrl={member.photoUrl} size="md" />
                <div>
                  <p className="log-member-hero-name">{member.name}</p>
                  <p className="log-member-hero-sub">
                    {member.relation} · {member.country}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="flow-lead">{isFamily ? ask.what : requestLog.what}</p>
              <div className={`grid grid-cols-3 gap-2 ${isFamily ? "need-grid--family" : "need-grid--log"}`}>
                {NEED_TYPES.map((n) => {
                  const meta = NEED_META[n];
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => applyNeedDefaults(n, member)}
                      className={`need-chip ${isFamily ? "need-chip--family" : "need-chip--log"} ${needType === n ? "selected" : ""}`}
                      style={needType === n ? { borderColor: meta.accent, background: meta.pale } : undefined}
                    >
                      <NeedIcon type={n} size={22} />
                      <span className="text-xs font-semibold text-ink">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`card-bordered ${isFamily ? "ask-amount-card" : "log-amount-card"}`}>
              <label className="field-label">{send.amount}</label>
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
              {isFamily ? (
                <p className="ask-amount-hint">{ask.amountHint}</p>
              ) : (
                <p className="log-amount-hint">{requestLog.amountHint(member.method)}</p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {["25", "38", "50", "85", "100"].map((v) => (
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

            {!isFamily && <FeeSavings amount={numAmount} />}
          </motion.div>
        )}

        {step === "details" && member && (
          <motion.div
            key="details"
            variants={slideForward}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`space-y-4 ${isFamily ? "ask-detail-stack" : "log-detail-stack"}`}
          >
            {isFamily ? (
              <div className="ask-hero ask-hero--compact">
                <MemberAvatar name={member.name} id={member.id} code={member.countryCode} photoUrl={member.photoUrl} size="md" />
                <div>
                  <p className="ask-hero-greeting">{member.name}</p>
                  <p className="ask-hero-sub">
                    {NEED_META[needType].label} · ${numAmount > 0 ? numAmount.toFixed(2) : "—"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="log-member-hero">
                <MemberAvatar name={member.name} id={member.id} code={member.countryCode} photoUrl={member.photoUrl} size="md" />
                <div>
                  <p className="log-member-hero-name">{member.name}</p>
                  <p className="log-member-hero-sub">
                    {NEED_META[needType].label} · ${numAmount > 0 ? numAmount.toFixed(2) : "—"}
                  </p>
                </div>
              </div>
            )}

            <div className={isFamily ? "ask-detail-panel" : "log-detail-panel"}>
            {isFamily ? (
              <p className="ask-detail-lead">{copy.details}</p>
            ) : (
              <p className="log-detail-lead">{copy.details}</p>
            )}
            <div>
              <label className="field-label">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={ask.messagePh}
                rows={4}
                className="input-field mt-2 resize-none"
              />
            </div>

            <div>
              <label className="field-label">{pull.billLabel}</label>
              <input
                value={billNote}
                onChange={(e) => setBillNote(e.target.value)}
                placeholder={ask.billPh}
                className="input-field mt-2"
              />
            </div>

            <div>
              <label className="field-label">{ask.dueLabel}</label>
              <div className="flex gap-2 flex-wrap mt-2">
                {DUE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setDueDays(opt.days)}
                    className={`stat-pill ${dueDays === opt.days ? "!bg-primary !text-on-primary !border-primary" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-caption text-xs mt-2">{pull.due(dueLabel)}</p>
            </div>
            </div>
          </motion.div>
        )}

        {step === "review" && member && (
          <motion.div
            key="review"
            variants={slideForward}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            {submitting ? (
              <ProcessingOverlay label={ask.sending} className="py-16" />
            ) : (
              <div className={`card-bordered space-y-4 ${isFamily ? "ask-review-card" : "log-review-card"}`}>
                <p className={isFamily ? "ask-review-eyebrow" : "log-review-eyebrow"}>
                  {isFamily ? ask.review : requestLog.reviewEyebrow}
                </p>
                <div className="flex items-center gap-3">
                  <NeedIcon type={needType} variant="tile" size={20} />
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {buildRequestTitle(needType, member.relation, billNote)}
                    </p>
                    <p className="text-caption text-xs">{member.name}</p>
                  </div>
                </div>
                {message && (
                  <>
                    <div className="h-px bg-border-soft" />
                    <p className="text-body text-sm">{message}</p>
                  </>
                )}
                {billNote && (
                  <p className="text-caption text-xs">{billNote}</p>
                )}
                <div className="h-px bg-border-soft" />
                <div className="flex justify-between">
                  <span className="text-caption text-sm">{send.amount}</span>
                  <span className="text-sm font-bold tabular-nums">${numAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-caption text-sm">{ask.dueLabel}</span>
                  <span className="text-sm font-semibold">{dueLabel}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {step === "done" && member && (
          <FlowSuccessPanel
            key="done"
            title={isFamily ? ask.successTitle : requestLog.successTitle}
            body={isFamily ? ask.successBody("Your sponsor") : requestLog.successBody}
            hint={isFamily ? ask.successHint : undefined}
            panel={isFamily}
            meta={[
              { label: send.amount, value: `$${numAmount.toFixed(2)}` },
              { label: ask.dueLabel, value: dueLabel },
            ]}
            actions={
              isFamily
                ? [
                    { label: ask.sponsorView, onClick: () => router.push("/login") },
                    {
                      label: ask.submit,
                      onClick: () => {
                        setStep(skippedWho ? "what" : "who");
                        setAmount("");
                        setBillNote("");
                        if (!skippedWho) setMember(null);
                      },
                      variant: "secondary",
                    },
                  ]
                : [
                    { label: requestLog.viewInbox, onClick: () => router.push("/requests") },
                    { label: send.backHome, onClick: () => router.push("/dashboard"), variant: "secondary" },
                  ]
            }
          />
        )}
      </AnimatePresence>
    </WizardShell>
  );
}