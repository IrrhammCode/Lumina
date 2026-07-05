import { pull } from "@/lib/copy";
import type { RequestSource } from "@/lib/requests";

type RequestSourceBadgeProps = {
  source: RequestSource;
  size?: "sm" | "md";
};

export default function RequestSourceBadge({ source, size = "sm" }: RequestSourceBadgeProps) {
  return (
    <span
      className={`source-badge ${source === "family" ? "source-family" : "source-caregiver"} ${size === "md" ? "source-badge-md" : ""}`}
    >
      {source === "family" ? pull.sourceFamily : pull.sourceCaregiver}
    </span>
  );
}