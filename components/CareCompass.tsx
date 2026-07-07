"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Loader2, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { getFamily } from "@/lib/family";
import { compass } from "@/lib/copy";
import { fadeScale } from "@/lib/motion";

type CareCompassProps = {
  isMagicMode?: boolean;
};

export default function CareCompass({ isMagicMode }: CareCompassProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [amounts, setAmounts] = useState<number[]>([]);
  const [poweredBy, setPoweredBy] = useState<"tavily" | "curated" | null>(null);
  const [expanded, setExpanded] = useState(false);

  const familyContext = getFamily()
    .map((m) => `${m.name} (${m.relation}, ${m.country})`)
    .join(", ");

  const ask = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setLoading(true);
      setError("");
      setAnswer(null);
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
    router.push(`/pay?amount=${amount}&need=pulsa`);
  };

  return (
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

            {answer && !loading && (
              <div className="care-compass-result">
                <p className="care-compass-answer">{answer}</p>
                {amounts.length > 0 && (
                  <div className="care-compass-actions">
                    <p className="care-compass-actions-label">{compass.sendLabel}</p>
                    <div className="care-compass-amounts">
                      {amounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className="care-compass-amount-btn"
                          onClick={() => sendAmount(amt)}
                        >
                          ${amt}
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
                  {poweredBy === "tavily" ? compass.poweredTavily : compass.poweredCurated}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}