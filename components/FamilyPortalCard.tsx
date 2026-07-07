"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Share2, ExternalLink, Link2, Check, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import LuminaLogo from "@/components/LuminaLogo";
import MemberAvatar from "@/components/MemberAvatar";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import {
  buildSignedPortalUrl,
  copyPortalUrl,
  sharePortalUrl,
  rotatePortalLink,
} from "@/lib/portal";
import { getPortalToken, getStoredUser } from "@/lib/auth";
import { getFamily } from "@/lib/family";
import { portal } from "@/lib/copy";
import { popIn } from "@/lib/motion";

type FamilyPortalCardProps = {
  variant?: "card" | "compact";
  memberId?: string;
};

export default function FamilyPortalCard({ variant = "card", memberId: initialMemberId }: FamilyPortalCardProps) {
  const router = useRouter();
  const { connector } = useLuminaUA();
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(
    () => !!getPortalToken() || !!getStoredUser()?.walletAddress
  );
  const [portalUrl, setPortalUrl] = useState("/ask");
  const [displayUrl, setDisplayUrl] = useState("lumina.app/ask");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId ?? null);
  const members = getFamily();

  const refreshUrl = useCallback(() => {
    void (async () => {
      setCanShare(!!getPortalToken() || !!getStoredUser()?.walletAddress);
      const url = await buildSignedPortalUrl({
        memberId: selectedMemberId ?? undefined,
        connector,
      });
      setPortalUrl(url);
      setDisplayUrl(url.replace(/^https?:\/\//, ""));
    })();
  }, [selectedMemberId, connector]);

  useEffect(() => {
    refreshUrl();
  }, [refreshUrl]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleCopy = async () => {
    if (!canShare) return;
    const ok = await copyPortalUrl(selectedMemberId ?? undefined, connector);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(portal.resetConfirm)) return;
    setResetting(true);
    const token = await rotatePortalLink();
    setResetting(false);
    if (token) {
      refreshUrl();
      showToast(portal.resetDone);
    }
  };

  const previewPath = (() => {
    try {
      const full = portalUrl.startsWith("http") ? portalUrl : `https://${portalUrl}`;
      const u = new URL(full);
      return u.pathname + u.search;
    } catch {
      return selectedMemberId ? `/ask?member=${selectedMemberId}` : "/ask";
    }
  })();

  if (variant === "compact") {
    return (
      <div className="portal-card portal-card-compact">
        <div className="portal-card-head">
          <span className="portal-card-icon">
            <Link2 size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">{portal.title}</p>
            <p className="text-caption text-xs truncate">
              {canShare ? displayUrl : portal.revokedHint}
            </p>
          </div>
        </div>
        <div className="portal-card-actions portal-card-actions-compact">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!canShare}
            className="btn-secondary btn-compact flex-1"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? portal.copied : portal.copy}
          </button>
          <button
            type="button"
            onClick={() => sharePortalUrl(selectedMemberId ?? undefined, connector)}
            disabled={!canShare}
            className="btn-primary btn-compact flex-1"
          >
            <Share2 size={14} />
            {portal.share}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="btn-ghost btn-compact"
            title={portal.resetLink}
          >
            <RefreshCw size={14} className={resetting ? "animate-spin" : ""} />
          </button>
        </div>
        <AnimatePresence>
          {toastMsg && (
            <motion.p variants={popIn} initial="hidden" animate="show" exit="exit" className="portal-copied-toast">
              {toastMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="portal-card">
      <div className="portal-card-brand">
        <span className="portal-card-logo">
          <LuminaLogo size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink">{portal.title}</p>
          <p className="text-caption text-xs">{canShare ? portal.sub : portal.revokedHint}</p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="btn-ghost btn-compact shrink-0"
          title={portal.resetLink}
        >
          <RefreshCw size={16} className={resetting ? "animate-spin" : ""} />
          <span className="sr-only">{portal.resetLink}</span>
        </button>
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
        <p className="portal-url-value">{canShare ? displayUrl : portal.revoked}</p>
      </div>

      <div className="portal-card-actions">
        <button type="button" onClick={handleCopy} disabled={!canShare} className="btn-secondary flex-1">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? portal.copied : portal.copy}
        </button>
        <button
          type="button"
          onClick={() => sharePortalUrl(selectedMemberId ?? undefined, connector)}
          disabled={!canShare}
          className="btn-secondary flex-1"
        >
          <Share2 size={16} />
          {portal.share}
        </button>
        <button
          type="button"
          onClick={() => router.push(previewPath)}
          disabled={!canShare}
          className="btn-ghost flex-1"
        >
          <ExternalLink size={16} />
          {portal.preview}
        </button>
      </div>

      <AnimatePresence>
        {(copied || toastMsg) && (
          <motion.p
            variants={popIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className="portal-copied-toast"
          >
            {toastMsg ?? portal.copied}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}