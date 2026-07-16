import type { FamilyMember } from "@/lib/family";
import MemberAvatar from "@/components/MemberAvatar";

export default function MemberChip({ member }: { member: FamilyMember }) {
  return (
    <div className="member-chip">
      <MemberAvatar name={member.name} id={member.id} code={member.countryCode} photoUrl={member.photoUrl} size="sm" />
      <span>{member.name} · {member.relation}</span>
    </div>
  );
}