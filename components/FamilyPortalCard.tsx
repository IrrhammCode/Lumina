"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, ExternalLink, Link2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import LuminaLogo from "@/components/LuminaLogo";
import MemberAvatar from "@/components/MemberAvatar";
import { getFamilyPortalUrl, copyPortalUrl, sharePortalUrl } from "@/lib/portal";
import { getFamily } from "@/lib/family";
import { portal } from "@/lib/copy";
import { popIn } from "@/lib/motion";

type FamilyPortalCardProps = {
  variant?: "card" | "compact";
  memberId?: string;
};

export default function FamilyPortalCard({ variant = "card", memberId: initialMemberId }: FamilyPortalCardProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [displayUrl, setDisplayUrl] = useState("lumina.app/ask");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId ?? null);
  const members = getFamily();

  useEffect(() => {
    setDisplayUrl(
      getFamilyPortalUrl(selectedMemberId ?? undefined).replace(/^https?:\/\//, "")
    );
  }, [selectedMemberId]);

  const handleCopy = async () => {
    const ok = await copyPortalUrl(selectedMemberId ?? undefined);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const previewHref = selectedMemberId ? `/ask?member=${selectedMemberId}` : "/ask";

  if (variant === "compact") {
    return (
      <div className="portal-card portal-card-compact">
        <div className="portal-card-head">
          <span className="portal-card-icon">
            <Link2 size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">{portal.title}</p>
            <p className="text-caption text-xs truncate">{displayUrl}</p>
          </div>
        </div>
        <div className="portal-card-actions portal-card-actions-compact">
          <button type="button" onClick={handleCopy} className="btn-secondary btn-compact flex-1">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? portal.copied : portal.copy}
          </button>
          <button
            type="button"
            onClick={() => sharePortalUrl(selectedMemberId ?? undefined)}
            className="btn-primary btn-compact flex-1"
          >
            <Share2 size={14} />
            {portal.share}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-card">
      <div className="portal-card-brand">
        <span className="portal-card-logo">
          <LuminaLogo size={20} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{portal.title}</p>
          <p className="text-caption text-xs">{portal.sub}</p>
        </div>
      </div>

      {members.length > 0 && (
        <div className="portal-member-pick">
          <p className="portal-url-label">{portal.pickMember}</p>
          <div className="portal-member-chips scrollbar-hide">
            <button
              type="button"
              onClick={() => setSelectedMemberId(null)}
              className={`portal-member-chip ${selectedMemberId === null ? "selected" : ""}`}
            >
              {portal.anyone}
            </button>
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMemberId(m.id)}
                className={`portal-member-chip ${selectedMemberId === m.id ? "selected" : ""}`}
              >
                <MemberAvatar code={m.countryCode} size="sm" />
                <span>{m.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="portal-url-box">
        <p className="portal-url-label">{portal.linkLabel}</p>
        <p className="portal-url-value">{displayUrl}</p>
      </div>

      <div className="portal-card-actions">
        <button type="button" onClick={handleCopy} className="btn-secondary flex-1">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? portal.copied : portal.copy}
        </button>
        <button
          type="button"
          onClick={() => sharePortalUrl(selectedMemberId ?? undefined)}
          className="btn-secondary flex-1"
        >
          <Share2 size={16} />
          {portal.share}
        </button>
        <button type="button" onClick={() => router.push(previewHref)} className="btn-ghost flex-1">
          <ExternalLink size={16} />
          {portal.preview}
        </button>
      </div>

      <AnimatePresence>
        {copied && (
          <motion.p
            variants={popIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className="portal-copied-toast"
          >
            {portal.copied}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}