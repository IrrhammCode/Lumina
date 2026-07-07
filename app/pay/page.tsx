"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import PaymentSuccessPanel from "@/components/PaymentSuccessPanel";
import ProcessingOverlay from "@/components/ProcessingOverlay";
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
  createManualPayment,
  type NeedType,
} from "@/lib/allowances";
import { slideForward, slideBack } from "@/lib/motion";
import { send, actions, fees, settlement } from "@/lib/copy";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import { settlementPaymentFields, type SettlementResult } from "@/lib/settlement";

type Step = "who" | "amount" | "review" | "done";

const NEED_TYPES = Object.keys(NEED_META) as NeedType[];

function PayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settle, refreshBalance } = useLuminaUA();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("who");
  const [search, setSearch] = useState("");
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [needType, setNeedType] = useState<NeedType>("pulsa");
  const [amount, setAmount] = useState("");
  const [showBio, setShowBio] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastSettlement, setLastSettlement] = useState<SettlementResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const family = getFamily().filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.relation.toLowerCase().includes(search.toLowerCase())
  );

  const numAmount = parseFloat(amount) || 0;
  const stepIndex = { who: 0, amount: 1, review: 2, done: 3 }[step];

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    const preAmount = searchParams.get("amount");
    const preNeed = searchParams.get("need") as NeedType | null;
    if (preAmount) setAmount(preAmount);
    if (preNeed && NEED_TYPES.includes(preNeed)) setNeedType(preNeed);
    if (preAmount) setStep("who");
    setReady(true);
  }, [router, searchParams]);

  const goBack = () => {
    const prev: Record<Step, Step | "exit"> = {
      who: "exit",
      amount: "who",
      review: "amount",
      done: "exit",
    };
    const p = prev[step];
    if (p === "exit") router.back();
    else setStep(p);
  };

  const selectMember = (m: FamilyMember) => {
    setMember(m);
    setStep("amount");
  };

  const onPay = () => setShowBio(true);

  const onBioConfirm = async () => {
    if (!member) return;
    setShowBio(false);
    setErrorMsg(null);
    setProcessing(true);
    const result = await settle(numAmount);
    setLastSettlement(result);
    const payment = await createManualPayment({
      memberId: member.id,
      needType,
      amount: numAmount,
      ...settlementPaymentFields(result),
    });
    void refreshBalance();
    setProcessing(false);
    if (!payment) {
      setErrorMsg(settlement.failed);
      return;
    }
    setStep("done");
  };

  if (!ready) return <PageLoading />;

  const subtitles: Record<Step, string> = {
    who: send.whoSub,
    amount: send.what,
    review: send.review,
    done: "",
  };

  const footer =
    step === "amount" && !processing ? (
      <button
        type="button"
        onClick={() => setStep("review")}
        disabled={numAmount <= 0}
        className="btn-primary"
      >
        {actions.continue}
      </button>
    ) : step === "review" && !processing ? (
      <button type="button" onClick={onPay} className="btn-primary">
        {send.pay(numAmount)}
      </button>
    ) : undefined;

  return (
    <>
      <WizardShell
        title={step === "done" ? send.successTitle : send.title}
        subtitle={subtitles[step]}
        step={stepIndex}
        stepLabels={send.steps}
        onBack={goBack}
        footer={footer}
        hideSteps={step === "done"}
        panel={step === "review"}
        theme="send"
        sendBrandLabel={send.brand}
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
              <p className="flow-lead">{send.who}</p>
              <div className="pay-search-box">
                <Search size={16} className="pay-search-icon" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={send.searchPh}
                  className="pay-search-input"
                />
              </div>
              <p className="pay-pick-label">{send.pickMember}</p>
              <div className="pay-member-grid">
                {family.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMember(m)}
                    className="pay-member-card"
                  >
                    <MemberAvatar code={m.countryCode} size="lg" />
                    <p className="pay-member-name">{m.name}</p>
                    <p className="pay-member-meta">{m.relation}</p>
                    <p className="pay-member-payout">{m.method}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "amount" && member && (
            <motion.div
              key="amount"
              variants={slideForward}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-5"
            >
              <div className="pay-member-hero">
                <MemberAvatar code={member.countryCode} size="md" />
                <div>
                  <p className="pay-member-hero-name">{member.name}</p>
                  <p className="pay-member-hero-sub">
                    {member.relation} · {member.country}
                  </p>
                </div>
              </div>

              <div>
                <p className="flow-lead">{send.what}</p>
                <div className="grid grid-cols-3 gap-2 need-grid--send">
                  {NEED_TYPES.map((n) => {
                    const meta = NEED_META[n];
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNeedType(n)}
                        className={`need-chip need-chip--send ${needType === n ? "selected" : ""}`}
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

              <div className="card-bordered pay-amount-card">
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
                <p className="pay-amount-hint">{send.amountHint(member.method)}</p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {["10", "25", "50", "100"].map((v) => (
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

          {step === "review" && member && (
            <motion.div
              key="review"
              variants={slideForward}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              {processing ? (
                <ProcessingOverlay label={settlement.confirming} className="py-16" />
              ) : errorMsg ? (
                <p className="text-sm font-medium text-negative text-center py-8">{errorMsg}</p>
              ) : (
                <div className="card-bordered space-y-4 pay-review-card">
                  <p className="pay-review-eyebrow">{send.reviewEyebrow}</p>
                  <div className="flex items-center gap-3">
                    <NeedIcon type={needType} variant="tile" size={20} />
                    <div>
                      <p className="text-sm font-bold text-ink">
                        {NEED_META[needType].label} for {member.relation}
                      </p>
                      <p className="text-caption text-xs">{member.name}</p>
                    </div>
                  </div>
                  <div className="h-px bg-border-soft" />
                  <div className="pay-review-total">
                    <span className="text-caption text-sm">{send.amount}</span>
                    <span className="pay-review-amount">${numAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-caption text-sm">{send.payout}</span>
                    <span className="text-sm font-semibold">{member.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-caption text-sm">{send.fee}</span>
                    <span className="badge-savings">{fees.free}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === "done" && member && (
            <PaymentSuccessPanel
              key="done"
              title={send.successTitle}
              body={send.successBody(numAmount, member.name)}
              hint={send.notified(member.relation)}
              settlement={lastSettlement}
              panel
              actions={[
                { label: send.viewHistory, onClick: () => router.push("/history") },
                { label: send.backHome, onClick: () => router.push("/dashboard"), variant: "secondary" },
              ]}
            />
          )}
        </AnimatePresence>
      </WizardShell>

      <BiometricPrompt
        isOpen={showBio}
        onConfirm={onBioConfirm}
        onCancel={() => setShowBio(false)}
        context="pay"
        amount={`$${numAmount.toFixed(2)}`}
        recipient={member ? member.name : undefined}
      />
    </>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PayPageContent />
    </Suspense>
  );
}