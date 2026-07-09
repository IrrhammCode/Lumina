"use client";

import { Inbox, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { pull } from "@/lib/copy";

export default function EmptyInbox() {
  const router = useRouter();

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