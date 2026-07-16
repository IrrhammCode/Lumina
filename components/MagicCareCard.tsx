"use client";

import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { shortAddress } from "@/lib/format";
import { useMagicWallet } from "@/app/providers/MagicWalletProvider";
import { magicCard } from "@/lib/copy";
import MemberAvatar from "@/components/MemberAvatar";
import { getUserPhotoUrl } from "@/lib/user-profile";

type MagicCareCardProps = {
  variant?: "full" | "compact";
  userName?: string;
};

function providerLabel(provider?: string): string {
  if (provider === "google") return "Google";
  if (provider === "apple") return "Apple";
  if (provider === "email") return "Email";
  return "Magic";
}

export default function MagicCareCard({ variant = "full", userName }: MagicCareCardProps) {
  const { address, isMagicMode } = useMagicWallet();
  const user = getStoredUser();
  const [copied, setCopied] = useState(false);

  if (!isMagicMode || !address) return null;

  const displayName = userName || user?.email?.split("@")[0] || "You";
  const userPhotoUrl = getUserPhotoUrl();
  const careId = shortAddress(address);
  const signedInWith = providerLabel(user?.provider);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (variant === "compact") {
    return (
      <div className="magic-care-card magic-care-card--compact magic-care-card--alive">
        <div className="magic-care-card-compact-head">
          <MemberAvatar name={displayName} id={user?.email} photoUrl={userPhotoUrl} size="md" />
          <div className="magic-care-card-compact-meta">
            <p className="magic-care-card-compact-name capitalize">{displayName}</p>
            <p className="magic-care-card-compact-via">{magicCard.signedIn(signedInWith)}</p>
          </div>
          <span className="magic-care-card-compact-pill">
            <Sparkles size={11} aria-hidden />
            Magic
          </span>
        </div>
        <div className="magic-care-card-compact-id">
          <span className="magic-care-card-compact-id-label">{magicCard.idLabel}</span>
          <span className="magic-care-card-compact-id-value">{careId}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="magic-care-card magic-care-card--alive">
      <div className="magic-care-card-shine" aria-hidden />
      <div className="magic-care-card-header">
        <span className="magic-care-card-brand">{magicCard.brand}</span>
        <span className="magic-care-card-pill">
          <Sparkles size={11} aria-hidden />
          {magicCard.invisible}
        </span>
      </div>
      <div className="magic-care-card-name-row">
        <MemberAvatar name={displayName} id={user?.email} photoUrl={userPhotoUrl} size="md" />
        <div>
          <p className="magic-care-card-name capitalize">{displayName}</p>
          <p className="magic-care-card-type">{magicCard.type}</p>
        </div>
      </div>
      <div className="magic-care-card-id-row">
        <div>
          <p className="magic-care-card-id-label">{magicCard.idLabel}</p>
          <p className="magic-care-card-id-value">{careId}</p>
        </div>
        <button type="button" onClick={onCopy} className="magic-care-card-copy" aria-label="Copy Care ID">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <p className="magic-care-card-foot">{magicCard.signedIn(signedInWith)}</p>
    </div>
  );
}