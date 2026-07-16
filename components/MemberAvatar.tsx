"use client";

import { useState } from "react";
import { getCountryMeta, normalizeCountryCode } from "@/lib/countries";
import {
  avatarPixelSize,
  avatarSeed,
  hashHue,
  initialsFromName,
  personAvatarUrl,
} from "@/lib/avatars";

type MemberAvatarProps = {
  name: string;
  id?: string;
  code?: string;
  photoUrl?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  className?: string;
};

const SIZES = {
  sm: "member-avatar-sm",
  md: "member-avatar-md",
  lg: "member-avatar-lg",
  xl: "member-avatar-xl",
  hero: "member-avatar-hero",
} as const;

export default function MemberAvatar({
  name,
  id,
  code,
  photoUrl,
  size = "md",
  className = "",
}: MemberAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = initialsFromName(name);
  const seed = avatarSeed(name, id);
  const src = photoUrl ?? personAvatarUrl(name, id, avatarPixelSize(size));
  const countryMeta = code ? getCountryMeta(normalizeCountryCode(code)) : null;
  const hue = hashHue(seed);

  const ringStyle = countryMeta
    ? { borderColor: countryMeta.color, boxShadow: `0 0 0 1px ${countryMeta.pale}` }
    : undefined;

  const fallbackStyle = {
    background: `linear-gradient(145deg, hsl(${hue} 62% 88%) 0%, hsl(${(hue + 28) % 360} 55% 78%) 100%)`,
    color: `hsl(${hue} 42% 28%)`,
  };

  return (
    <div
      className={`member-avatar member-avatar-photo ${SIZES[size]} ${className}`}
      style={ringStyle}
      title={name}
    >
      {!imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="member-avatar-initials" style={fallbackStyle} aria-hidden>
          {initials}
        </span>
      )}
    </div>
  );
}