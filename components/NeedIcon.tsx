import type { NeedType } from "@/lib/allowances";
import { NEED_META } from "@/lib/allowances";
import PulsaIcon from "@/components/icons/needs/PulsaIcon";
import ElectricityIcon from "@/components/icons/needs/ElectricityIcon";
import SchoolIcon from "@/components/icons/needs/SchoolIcon";
import HealthIcon from "@/components/icons/needs/HealthIcon";
import RentIcon from "@/components/icons/needs/RentIcon";
import CustomIcon from "@/components/icons/needs/CustomIcon";

const ICONS = {
  pulsa: PulsaIcon,
  electricity: ElectricityIcon,
  school: SchoolIcon,
  health: HealthIcon,
  rent: RentIcon,
  custom: CustomIcon,
} as const;

type NeedIconProps = {
  type: NeedType;
  size?: number;
  className?: string;
  variant?: "plain" | "tile";
};

export default function NeedIcon({ type, size = 20, className = "", variant = "plain" }: NeedIconProps) {
  const meta = NEED_META[type];
  const Icon = ICONS[type];

  if (variant === "tile") {
    return (
      <div className={`need-icon ${className}`} style={{ background: meta.pale, color: meta.accent }}>
        <Icon size={size} />
      </div>
    );
  }

  return (
    <span className={`inline-flex ${className}`} style={{ color: meta.accent }}>
      <Icon size={size} />
    </span>
  );
}