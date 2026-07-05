import { getCountryMeta, normalizeCountryCode } from "@/lib/countries";

type MemberAvatarProps = {
  code: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = {
  sm: "member-avatar-sm",
  md: "member-avatar-md",
  lg: "member-avatar-lg",
} as const;

export default function MemberAvatar({ code, size = "md", className = "" }: MemberAvatarProps) {
  const normalized = normalizeCountryCode(code);
  const meta = getCountryMeta(normalized);

  return (
    <div
      className={`member-avatar ${SIZES[size]} ${className}`}
      style={{ background: meta.pale, color: meta.color }}
      aria-hidden
    >
      <span>{meta.code}</span>
    </div>
  );
}