"use client";

import { useEffect, useState } from "react";
import { Loader2, Lightbulb } from "lucide-react";
import { api } from "@/lib/api-client";
import { onboarding } from "@/lib/copy";
import type { FamilyMember } from "@/lib/family";

type OnboardingFamilyInsightProps = {
  members: FamilyMember[];
};

export default function OnboardingFamilyInsight({ members }: OnboardingFamilyInsightProps) {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const country = members[0]?.country;
  const names = members.map((m) => `${m.name} (${m.relation})`).join(", ");

  useEffect(() => {
    if (!country || members.length === 0) {
      setTip(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      const query = `Typical monthly care costs diaspora sends to family in ${country} for pulsa, school fees, medicine — USD amounts`;
      const result = await api.careCompass(query, names);
      if (cancelled) return;
      if (result.ok) setTip(result.data.answer);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [country, names, members.length]);

  if (!country || members.length === 0) return null;

  return (
    <div className="onboard-family-insight">
      <div className="onboard-family-insight-head">
        <Lightbulb size={16} className="text-glow" />
        <span>{onboarding.familyInsightTitle(country)}</span>
      </div>
      {loading ? (
        <div className="onboard-family-insight-loading">
          <Loader2 size={16} className="animate-spin" />
          <span>{onboarding.familyInsightLoading}</span>
        </div>
      ) : tip ? (
        <p className="onboard-family-insight-body">{tip}</p>
      ) : null}
      <p className="onboard-family-insight-foot">{onboarding.familyInsightFoot}</p>
    </div>
  );
}