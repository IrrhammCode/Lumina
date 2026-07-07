"use client";

import { useState } from "react";
import { Loader2, PenLine, Check } from "lucide-react";
import { hasMagicConfig } from "@/lib/magic-config";
import { api } from "@/lib/api-client";
import { signCarePledge, storePledgeRef, getStoredPledgeRef } from "@/lib/magic-pledge";
import { onboarding } from "@/lib/copy";

type OnboardingPledgeProps = {
  familyNames: string[];
};

export default function OnboardingPledge({ familyNames }: OnboardingPledgeProps) {
  const enabled = hasMagicConfig();
  const [signed, setSigned] = useState(Boolean(getStoredPledgeRef()));
  const [loading, setLoading] = useState(false);

  if (!enabled || signed) {
    if (!enabled) return null;
    return (
      <div className="onboard-pledge-done">
        <Check size={16} strokeWidth={3} />
        <span>{onboarding.pledgeDone}</span>
      </div>
    );
  }

  const onSign = async () => {
    setLoading(true);
    const sig = await signCarePledge(familyNames);
    if (sig) {
      storePledgeRef(sig);
      const ref = getStoredPledgeRef();
      if (ref) await api.saveCarePledge(ref, sig);
      setSigned(true);
    }
    setLoading(false);
  };

  return (
    <div className="onboard-pledge-panel">
      <p className="onboard-pledge-title">{onboarding.pledgeTitle}</p>
      <p className="onboard-pledge-sub">{onboarding.pledgeSub}</p>
      <button type="button" onClick={onSign} disabled={loading} className="btn-secondary w-full">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <PenLine size={18} />}
        {onboarding.pledgeCta}
      </button>
    </div>
  );
}