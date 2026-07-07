"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Plus, Check, Users } from "lucide-react";
import WizardShell from "@/components/WizardShell";
import PageLoading from "@/components/PageLoading";
import { getStoredUser, setOnboarded } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { hasParticleConfig } from "@/lib/particle-config";
import { hasMagicConfig } from "@/lib/magic-config";
import { slideForward, slideBack, fadeScale } from "@/lib/motion";
import { defaultFamily, getFamily, setFamily, type FamilyMember } from "@/lib/family";
import { onboarding, family, portal } from "@/lib/copy";
import MemberAvatar from "@/components/MemberAvatar";
import FamilyPortalCard from "@/components/FamilyPortalCard";
import OnboardingPledge from "./OnboardingPledge";

const OnboardingWalletStep = dynamic(() => import("./OnboardingWalletStep"), { ssr: false });
const OnboardingMagicWalletStep = dynamic(() => import("./OnboardingMagicWalletStep"), { ssr: false });

type Step = "welcome" | "wallet" | "family" | "ready";
const SUGGESTED = defaultFamily.slice(0, 3);

export default function OnboardingPage() {
  const router = useRouter();
  const isMagicOnboarding = hasMagicConfig();
  const isUaOnboarding = hasParticleConfig() && !isMagicOnboarding;
  const stepOrder = useMemo<Step[]>(
    () =>
      isMagicOnboarding || isUaOnboarding
        ? ["welcome", "wallet", "family", "ready"]
        : ["welcome", "family", "ready"],
    [isMagicOnboarding, isUaOnboarding]
  );

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [selected, setSelected] = useState<string[]>([]);
  const [customName, setCustomName] = useState("");
  const [customRelation, setCustomRelation] = useState("");

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    setSelected(SUGGESTED.map((m) => m.id));
    setReady(true);
  }, [router]);

  const stepIndex = stepOrder.indexOf(step);
  const perks = isMagicOnboarding
    ? onboarding.perksMagic
    : isUaOnboarding
      ? onboarding.perksUa
      : onboarding.perks;

  const toggleMember = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    const member: FamilyMember = {
      id: `fam_${Date.now()}`,
      name: customName.trim(),
      relation: customRelation.trim() || "Family",
      countryCode: "XX",
      country: "Home",
      method: "Local wallet",
      currency: "USD",
    };
    setFamily([...getFamily(), member]);
    setSelected((prev) => [...prev, member.id]);
    setCustomName("");
    setCustomRelation("");
  };

  const finish = async () => {
    const picked = getFamily().filter((m) => selected.includes(m.id));
    const family = picked.length > 0 ? picked : SUGGESTED;
    setFamily(family);
    await api.completeOnboarding(family);
    setOnboarded();
    router.replace("/dashboard");
  };

  const goBack = () => {
    const idx = stepOrder.indexOf(step);
    if (idx <= 0) router.back();
    else setStep(stepOrder[idx - 1]);
  };

  const goNext = () => {
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  };

  if (!ready) return <PageLoading />;

  const titles: Record<Step, string> = {
    welcome: onboarding.welcomeTitle,
    wallet: isMagicOnboarding ? onboarding.magicWalletHeadline : onboarding.walletTitle,
    family: onboarding.familySub,
    ready: onboarding.readyTitle,
  };

  const subs: Record<Step, string> = {
    welcome: onboarding.welcomeSub,
    wallet: isMagicOnboarding ? onboarding.magicWalletSub : onboarding.walletSub,
    family: "",
    ready: onboarding.readySub(selected.length || SUGGESTED.length),
  };

  const footer =
    step === "welcome" ? (
      <button type="button" onClick={goNext} className="btn-primary">
        {onboarding.ctaStart}
      </button>
    ) : step === "wallet" ? (
      <button type="button" onClick={goNext} className="btn-primary">
        {onboarding.ctaWallet}
      </button>
    ) : step === "family" ? (
      <button type="button" onClick={goNext} disabled={selected.length === 0} className="btn-primary">
        {onboarding.ctaFamily(selected.length)}
      </button>
    ) : (
      <button type="button" onClick={finish} className="btn-primary">
        {onboarding.ctaDone}
      </button>
    );

  return (
    <WizardShell
      title={titles[step]}
      subtitle={subs[step] || undefined}
      step={stepIndex}
      stepLabels={
        isMagicOnboarding
          ? onboarding.stepsMagic
          : isUaOnboarding
            ? onboarding.stepsUa
            : onboarding.steps
      }
      onBack={goBack}
      footer={footer}
      panel={step === "welcome" || step === "ready" || step === "wallet"}
      theme="onboarding"
      onboardingBrandLabel={onboarding.brand}
    >
      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div key="w" variants={slideBack} initial="initial" animate="animate" exit="exit">
            <div className="onboard-perks-panel">
              {perks.map((t) => (
                <div key={t} className="onboard-perk-row">
                  <span className="onboard-perk-check">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="onboard-perk-text">{t}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {step === "wallet" && isMagicOnboarding && (
          <motion.div key="wallet-magic" variants={slideForward} initial="initial" animate="animate" exit="exit">
            <OnboardingMagicWalletStep />
          </motion.div>
        )}
        {step === "wallet" && isUaOnboarding && (
          <motion.div key="wallet-ua" variants={slideForward} initial="initial" animate="animate" exit="exit">
            <OnboardingWalletStep />
          </motion.div>
        )}
        {step === "family" && (
          <motion.div key="f" variants={slideForward} initial="initial" animate="animate" exit="exit" className="space-y-4">
            <p className="onboard-pick-label">{onboarding.familyPick}</p>
            <div className="onboard-family-grid">
              {SUGGESTED.map((m) => {
                const picked = selected.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={`onboard-family-card ${picked ? "selected" : ""}`}
                  >
                    <MemberAvatar code={m.countryCode} size="lg" />
                    <p className="onboard-family-name">{m.name}</p>
                    <p className="onboard-family-meta">{m.relation}</p>
                    <span className={`onboard-family-check ${picked ? "selected" : ""}`}>
                      {picked && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="onboard-add-panel">
              <p className="field-label">{onboarding.addTitle}</p>
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={family.namePh} className="input-field" />
              <input value={customRelation} onChange={(e) => setCustomRelation(e.target.value)} placeholder={family.relationPh} className="input-field" />
              <button type="button" onClick={addCustom} disabled={!customName.trim()} className="btn-tertiary w-full py-2.5 text-sm">
                <Plus size={16} />
                {family.add}
              </button>
            </div>
          </motion.div>
        )}
        {step === "ready" && (
          <motion.div key="r" variants={fadeScale} initial="initial" animate="animate" exit="exit" className="onboard-ready-stack">
            <div className="onboard-ready-icon">
              <Users size={32} className="text-glow" />
            </div>
            <p className="onboard-ready-sub">{subs.ready}</p>
            <div className="onboard-next-panel">
              <p className="onboard-next-eyebrow">{onboarding.nextTitle}</p>
              <ul className="onboard-next-list">
                {onboarding.nextItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <OnboardingPledge
              familyNames={getFamily()
                .filter((m) => selected.includes(m.id))
                .map((m) => m.name)}
            />
            <div className="onboard-portal-slot">
              <p className="field-label">{portal.title}</p>
              <p className="text-caption text-xs">{portal.onboardingHint}</p>
              <FamilyPortalCard variant="compact" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WizardShell>
  );
}