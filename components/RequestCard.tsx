"use client";

import { motion } from "framer-motion";
import { NEED_META } from "@/lib/allowances";
import { formatRequestAge, type CareRequest } from "@/lib/requests";
import { getMemberById } from "@/lib/family";
import { ChevronRight } from "lucide-react";
import { tapScaleSoft } from "@/lib/motion";
import { pull } from "@/lib/copy";
import NeedIcon from "@/components/NeedIcon";
import MemberAvatar from "@/components/MemberAvatar";
import RequestSourceBadge from "@/components/RequestSourceBadge";
import RequestStatusBadge from "@/components/RequestStatusBadge";

type RequestCardProps = {
  request: CareRequest;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  onOpen?: (id: string) => void;
  compact?: boolean;
};

export default function RequestCard({
  request,
  onApprove,
  onDecline,
  onOpen,
  compact = false,
}: RequestCardProps) {
  const meta = NEED_META[request.needType];
  const member = getMemberById(request.memberId);

  const isPending = request.status === "pending";

  return (
    <motion.div
      layout
      {...tapScaleSoft}
      className={`request-card ${isPending ? "request-card--pending" : ""}`}
    >
      <div className="request-accent" style={{ background: meta.accent }} />
      <div className="request-body">
        <button type="button" className="w-full text-left border-none bg-transparent p-0" onClick={() => onOpen?.(request.id)}>
          <div className="flex items-start gap-3">
            <NeedIcon type={request.needType} variant="tile" size={18} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-caption text-xs">{formatRequestAge(request.createdAt)}</p>
                {request.status === "pending" ? (
                  <RequestSourceBadge source={request.source} />
                ) : (
                  <RequestStatusBadge status={request.status} />
                )}
              </div>
              <p className="text-sm font-bold text-ink mt-0.5">{request.title}</p>
              {member && (
                <div className="flex items-center gap-1.5 mt-1">
                  <MemberAvatar code={member.countryCode} size="sm" />
                  <p className="text-caption text-xs">{member.name}</p>
                </div>
              )}
              {!compact && <p className="text-body text-sm mt-2 line-clamp-2">{request.message}</p>}
              <p className="text-xs font-medium text-mute mt-1">{pull.due(request.dueLabel)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold tabular-nums text-ink">${request.amount.toFixed(0)}</p>
              <ChevronRight size={16} className="text-mute ml-auto mt-2" />
            </div>
          </div>
        </button>

        {onApprove && onDecline && (
          <div className="flex gap-2 mt-4">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => onDecline(request.id)} className="btn-ghost">
              {pull.decline}
            </motion.button>
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => onApprove(request.id)} className="btn-primary btn-compact">
              {pull.approve(request.amount)}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}