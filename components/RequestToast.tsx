"use client";

import { motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { getMemberById } from "@/lib/family";
import type { CareRequest } from "@/lib/requests";
import { toast as copy } from "@/lib/copy";
import { springSnappy } from "@/lib/motion";
import MemberAvatar from "@/components/MemberAvatar";
import NeedIcon from "@/components/NeedIcon";

type RequestToastProps = {
  request: CareRequest;
  onView: () => void;
  onDismiss: () => void;
};

export default function RequestToast({ request, onView, onDismiss }: RequestToastProps) {
  const member = getMemberById(request.memberId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={springSnappy}
      className="request-toast"
      role="alert"
    >
      <span className="request-toast-icon">
        <Bell size={16} />
      </span>
      {member && <MemberAvatar code={member.countryCode} size="sm" />}
      <NeedIcon type={request.needType} size={16} />
      <div className="request-toast-body min-w-0 flex-1">
        <p className="text-sm font-bold text-ink truncate">
          {member ? copy.newRequest(member.name, request.amount) : request.title}
        </p>
        <p className="text-caption text-xs truncate">{copy.newRequestSub}</p>
      </div>
      <button type="button" onClick={onView} className="request-toast-cta">
        {copy.view}
      </button>
      <button type="button" onClick={onDismiss} className="request-toast-close" aria-label={copy.dismiss}>
        <X size={16} />
      </button>
    </motion.div>
  );
}