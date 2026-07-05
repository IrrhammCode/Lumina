interface LuminaLogoProps {
  size?: number;
  className?: string;
}

export default function LuminaLogo({ size = 28, className = "" }: LuminaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 10L22 13.5V20.5L16 24L10 20.5V13.5L16 10Z" fill="currentColor" />
    </svg>
  );
}