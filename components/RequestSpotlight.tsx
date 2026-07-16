"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NEED_META } from "@/lib/allowances";
import { formatRequestAge, type CareRequest } from "@/lib/requests";
import { getMemberById } from "@/lib/family";
import { home, pull } from "@/lib/copy";
import NeedIcon from "@/components/NeedIcon";
import MemberAvatar from "@/components/MemberAvatar";
import RequestSourceBadge from "@/components/RequestSourceBadge";

type RequestSpotlightProps = {
  requests: CareRequest[];
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
  onOpen: (id: string) => void;
  onSeeAll: () => void;
  compact?: boolean;
};

export default function RequestSpotlight({
  requests,
  onApprove,
  onDecline,
  onOpen,
  onSeeAll,
  compact = false,
}: RequestSpotlightProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const single = requests.length === 1;

  const scrollTo = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(i, requests.length - 1));
    const child = el.children[clamped] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setIndex(clamped);
  };

  const sectionHead = (
    <div className="section-head">
      <div>
        <p className="section-eyebrow">{home.pullEyebrow}</p>
        <h2 className="section-title">{home.pullTitle}</h2>
      </div>
      <button type="button" onClick={onSeeAll} className="section-link">
        {pull.seeAll(requests.length)}
      </button>
    </div>
  );

  const renderCard = (req: CareRequest, inCarousel?: boolean) => {
    const meta = NEED_META[req.needType];
    const member = getMemberById(req.memberId);

    return (
      <article key={req.id} className={`inbox-priority-card inbox-priority-card--live ${inCarousel ? "spotlight-card" : ""}`}>
        <div className="inbox-priority-head">
          <span className="need-pill need-pill-dynamic need-pill-icon" style={{ "--pill-bg": meta.pale, "--pill-fg": meta.accent } as React.CSSProperties}>
            <NeedIcon type={req.needType} size={14} />
            {meta.label}
          </span>
          <div className="inbox-priority-head-meta">
            <RequestSourceBadge source={req.source} />
            <p className="inbox-priority-sub">{formatRequestAge(req.createdAt)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(req.id)}
          className="inbox-priority-amount-row w-full text-left border-none bg-transparent p-0 cursor-pointer"
        >
          <p className="inbox-priority-amount">${req.amount.toFixed(0)}</p>
          <div className="inbox-priority-meta">
            <p className="inbox-priority-title">{req.title}</p>
            <p className="inbox-priority-sub">{pull.due(req.dueLabel)}</p>
          </div>
        </button>

        {member && (
          <div className="inbox-priority-member">
            <MemberAvatar name={member.name} id={member.id} code={member.countryCode} photoUrl={member.photoUrl} size="lg" />
            <div>
              <p className="spotlight-name">{member.name}</p>
              <p className="spotlight-meta">{member.relation}</p>
            </div>
          </div>
        )}

        <div className="inbox-priority-actions">
          <button type="button" onClick={() => onDecline(req.id)} className="btn-ghost">
            {pull.decline}
          </button>
          <button type="button" onClick={() => onApprove(req.id)} className="btn-primary btn-compact">
            {pull.approve(req.amount)}
          </button>
        </div>
      </article>
    );
  };

  return (
    <section className={`inbox-priority ${compact ? "inbox-priority-compact" : ""}`}>
      {compact ? (
        <div className="inbox-priority-compact-bar">
          <p className="inbox-priority-compact-label">
            {requests.length} {home.awaiting.toLowerCase()}
          </p>
          <button type="button" onClick={onSeeAll} className="section-link">
            {pull.seeAll(requests.length)}
          </button>
        </div>
      ) : (
        sectionHead
      )}
      {single ? (
        renderCard(requests[0])
      ) : (
        <>
          <div
            ref={scrollRef}
            className="spotlight-track scrollbar-hide"
            onScroll={() => {
              const el = scrollRef.current;
              if (!el || !el.children.length) return;
              const w = (el.children[0] as HTMLElement).offsetWidth + 12;
              setIndex(Math.round(el.scrollLeft / w));
            }}
          >
            {requests.map((r) => renderCard(r, true))}
          </div>
          <div className="spotlight-nav">
            <button type="button" onClick={() => scrollTo(index - 1)} disabled={index === 0} className="spotlight-arrow" aria-label="Previous">
              <ChevronLeft size={18} />
            </button>
            <div className="spotlight-dots">
              {requests.map((r, i) => (
                <button key={r.id} type="button" onClick={() => scrollTo(i)} className={`spotlight-dot ${i === index ? "active" : ""}`} aria-label={`Request ${i + 1}`} />
              ))}
            </div>
            <button type="button" onClick={() => scrollTo(index + 1)} disabled={index === requests.length - 1} className="spotlight-arrow" aria-label="Next">
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}