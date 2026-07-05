import type { FamilyMember } from "@/lib/family";
import MemberAvatar from "@/components/MemberAvatar";

export default function MemberChip({ member }: { member: FamilyMember }) {
  return (
    <div className="member-chip">
      <MemberAvatar code={member.countryCode} size="sm" />
      <span>{member.name} · {member.relation}</span>
    </div>
  );
}