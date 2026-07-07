"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Loader2, Sparkles, ArrowRight, ExternalLink, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { getFamily } from "@/lib/family";
import { compass } from "@/lib/copy";
import { fadeScale } from "@/lib/motion";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import BiometricPrompt from "@/components/BiometricPrompt";
import { createManualPayment } from "@/lib/allowances";
import { settlementPaymentFields } from "@/lib/settlement";

type CareCompassProps = {
  isMagicMode?: boolean;
};

export default function CareCompass({ isMagicMode }: CareCompassProps) {
  const router = useRouter();
  const { settle, refreshBalance } = useLuminaUA();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [amounts, setAmounts] = useState<number[]>([]);
  const [poweredBy, setPoweredBy] = useState<"tavily" | "curated" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expressAmount, setExpressAmount] = useState<number | null>(null);
  const [showBio, setShowBio] = useState(false);
  const [expressSuccess, setExpressSuccess] = useState(false);

  const family = getFamily();
  const familyContext = family
    .map((m) => `${m.name} (${m.relation}, ${m.country})`)
    .join(", ");
  const expressRecipient = family[0]?.name;

  const ask = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setLoading(true);
      setError("");
      setAnswer(null);
      setExpressSuccess(false);
      setExpanded(true);
      const result = await api.careCompass(trimmed, familyContext || undefined);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setAnswer(result.data.answer);
      setSources(result.data.sources);
      setAmounts(result.data.suggestedAmounts);
      setPoweredBy(result.data.poweredBy);
      setLoading(false);
    },
    [familyContext]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(query);
  };

  const sendAmount = (amount: number) => {
    if (isMagicMode && family[0]) {
      setExpressAmount(amount);
      setShowBio(true);
      return;
    }
    router.push(`/pay?amount=${amount}&need=pulsa`);
  };

  const onExpressConfirm = async () => {
    setShowBio(false);
    if (!expressAmount || !family[0]) return;

    try {
    const result = await settle(expressAmount);
    const payment = await createManualPayment({
      memberId: family[0].id,
      needType: "pulsa",
      amount: expressAmount,
      label: compass.expressLabel,
      ...settlementPaymentFields(result),
    });

    if (!payment) {
      setError(compass.expressFailed);
      return;
    }

    setExpressSuccess(true);
    void refreshBalance();
    setExpressAmount(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : compass.expressFailed);
    }
  };

  return (
    <>
      <section className="care-compass">
        <button
          type="button"
          className="care-compass-header"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span className="care-compass-icon">
            <Compass size={18} strokeWidth={2} />
          </span>
          <div className="care-compass-head-text">
            <p className="care-compass-eyebrow">{compass.eyebrow}</p>
            <p className="care-compass-title">{compass.title}</p>
          </div>
          {isMagicMode && (
            <span className="care-compass-magic-pill">
              <Sparkles size={12} aria-hidden />
              Magic
            </span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="body"
              variants={fadeScale}
              initial="initial"
              animate="animate"
              exit="exit"
              className="care-compass-body"
            >
              <p className="care-compass-sub">{compass.sub}</p>

              <div className="care-compass-chips">
                {compass.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="care-compass-chip"
                    disabled={loading}
                    onClick={() => {
                      setQuery(prompt);
                      void ask(prompt);
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="care-compass-form">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={compass.placeholder}
                  className="care-compass-input"
                  disabled={loading}
                  maxLength={280}
                />
                <button type="submit" disabled={loading || !query.trim()} className="care-compass-submit">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                </button>
              </form>

              {error && <p className="text-negative text-xs mt-2">{error}</p>}

              {loading && (
                <div className="care-compass-loading">
                  <Loader2 size={20} className="animate-spin text-glow" />
                  <span>{compass.searching}</span>
                </div>
              )}

              {expressSuccess && (
                <p className="care-compass-express-success">{compass.expressSuccess}</p>
              )}

              {answer && !loading && (
                <div className="care-compass-result">
                  <p className="care-compass-answer">{answer}</p>
                  {amounts.length > 0 && (
                    <div className="care-compass-actions">
                      <p className="care-compass-actions-label">
                        {isMagicMode ? compass.expressLabel : compass.sendLabel}
                      </p>
                      <div className="care-compass-amounts">
                        {amounts.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            className={`care-compass-amount-btn ${isMagicMode ? "care-compass-amount-btn--express" : ""}`}
                            onClick={() => sendAmount(amt)}
                          >
                            {isMagicMode && <Zap size={14} aria-hidden />}
                            {isMagicMode ? compass.expressCta(amt) : `$${amt}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {sources.length > 0 && (
                    <ul className="care-compass-sources">
                      {sources.map((s) => (
                        <li key={s.url}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="care-compass-source">
                            {s.title}
                            <ExternalLink size={12} aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="care-compass-powered">
                    {poweredBy === "tavily" ? compass.poweredLive : compass.poweredCurated}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <BiometricPrompt
        isOpen={showBio}
        onConfirm={onExpressConfirm}
        onCancel={() => {
          setShowBio(false);
          setExpressAmount(null);
        }}
        context="pay"
        amount={expressAmount != null ? `$${expressAmount.toFixed(2)}` : undefined}
        recipient={expressRecipient}
      />
    </>
  );
}