import type { IconProps } from "../types";

export default function SchoolIcon({ size = 20, className = "" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 3L3 8.5 12 14l9-5.5L12 3z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M6 11v4.5c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5V11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M20 9v6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}