"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import type { FamilyMember } from "@/lib/family";
import { copyPortalUrl, sharePortalUrl } from "@/lib/portal";
import { portal } from "@/lib/copy";

type MemberShareButtonProps = {
  member: FamilyMember;
};

export default function MemberShareButton({ member }: MemberShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shared = await sharePortalUrl(member.id);
    if (!shared) {
      const ok = await copyPortalUrl(member.id);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="member-share-btn"
      aria-label={`${portal.memberShare} ${member.name}`}
      title={portal.memberShare}
    >
      {copied ? <Check size={15} /> : <Share2 size={15} />}
    </button>
  );
}