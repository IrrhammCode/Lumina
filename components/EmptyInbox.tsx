"use client";

import { Inbox, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { pull } from "@/lib/copy";

type EmptyInboxProps = {
  variant?: "panel" | "compact";
};

export default function EmptyInbox({ variant = "panel" }: EmptyInboxProps) {
  const router = useRouter();

  if (variant === "compact") {
    return (
      <div className="empty-inbox-compact">
        <span className="empty-inbox-compact-icon" aria-hidden>
          <Inbox size={15} />
        </span>
        <div className="empty-inbox-compact-text">
          <p className="empty-inbox-compact-title">{pull.emptyPendingShort}</p>
          <p className="empty-inbox-compact-sub">{pull.emptyInboxSubShort}</p>
        </div>
        <button
          type="button"
          className="empty-inbox-compact-cta"
          onClick={() => router.push("/settings")}
        >
          <Share2 size={13} />
          {pull.emptyInboxCta}
        </button>
      </div>
    );
  }

  return (
    <div className="empty-inbox-panel">
      <div className="empty-state-icon" aria-hidden>
        <Inbox size={28} />
      </div>
      <p className="empty-inbox-title">{pull.emptyPending}</p>
      <p className="empty-inbox-sub">{pull.emptyInboxSub}</p>
      <button type="button" className="btn-secondary btn-inline" onClick={() => router.push("/settings")}>
        <Share2 size={16} />
        {pull.emptyInboxCta}
      </button>
    </div>
  );
}