"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import PaymentSuccessPanel from "@/components/PaymentSuccessPanel";
import type { SettlementResult } from "@/lib/settlement";
import InboxFlowHeader from "@/components/InboxFlowHeader";
import MetaRow from "@/components/MetaRow";
import BiometricPrompt from "@/components/BiometricPrompt";
import {
  getRequestById,
  approveRequest,
  declineRequest,
  formatRequestAge,
} from "@/lib/requests";
import { getMemberById } from "@/lib/family";
import { NEED_META, getPaymentByRequestId } from "@/lib/allowances";
import { pull } from "@/lib/copy";
import NeedIcon from "@/components/NeedIcon";
import MemberAvatar from "@/components/MemberAvatar";
import RequestSourceBadge from "@/components/RequestSourceBadge";
import RequestStatusBadge from "@/components/RequestStatusBadge";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import { settlementPaymentFields, paymentToSettlement } from "@/lib/settlement";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import FlowPageBody from "@/components/FlowPageBody";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { settle, refreshBalance } = useLuminaUA();
  const [showBio, setShowBio] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastSettlement, setLastSettlement] = useState<SettlementResult | null>(null);
  const [status, setStatus] = useState(() => getRequestById(id)?.status ?? "pending");

  const request = getRequestById(id);
  const member = request ? getMemberById(request.memberId) : undefined;

  if (!request || !member) {
    return (
      <div className="flow-page">
        <div className="content-wrap flow-body">
          <p className="text-caption">{pull.notFound}</p>
        </div>
      </div>
    );
  }

  const meta = NEED_META[request.needType];
  const isPending = status === "pending";
  const paidPayment = status === "paid" ? getPaymentByRequestId(id) : undefined;
  const displaySettlement =
    lastSettlement ?? (paidPayment ? paymentToSettlement(paidPayment) : null);

  const handleApprove = () => setShowBio(true);

  const onBioConfirm = async () => {
    setShowBio(false);
    setProcessing(true);
    const result = await settle(request.amount);
    setLastSettlement(result);
    approveRequest(id, settlementPaymentFields(result));
    void refreshBalance();
    setProcessing(false);
    setSuccess(true);
    setStatus("paid");
  };

  const handleDecline = () => {
    declineRequest(id);
    setStatus("declined");
    router.back();
  };

  const showActions = isPending && !processing && !success;

  return (
    <div className={`flow-page flow-page--inbox ${isPending ? "flow-page--inbox-pending" : ""}`}>
      <div className="content-wrap">
        <InboxFlowHeader
          title={pull.detailTitle}
          subtitle={`${member.name} · ${member.relation}`}
          onBack={() => router.back()}
          badge={
            isPending ? (
              <RequestSourceBadge source={request.source} size="md" />
            ) : (
              <RequestStatusBadge status={status} />
            )
          }
        />
      </div>

      <div className="inbox-detail-hero">
        <div className="inbox-detail-member">
          <MemberAvatar code={member.countryCode} size="lg" />
          <div>
            <p className="inbox-detail-amount">${request.amount.toFixed(2)}</p>
            <p className="inbox-detail-title">{request.title}</p>
          </div>
        </div>
        <p className="inbox-detail-meta">
          {formatRequestAge(request.createdAt)} · {pull.due(request.dueLabel)}
        </p>
      </div>

      <FlowPageBody className="space-y-4">
        <div className="inbox-message-panel">
          <p className="text-body text-sm leading-relaxed">{request.message}</p>
        </div>

        <div className="detail-receipt">
          <div className="detail-receipt-header">
            <FileText size={18} className="text-mute" />
            <span className="field-label !mb-0">{pull.billLabel}</span>
          </div>
          <div className="detail-receipt-body">
            <div className="flex items-center gap-3">
              <NeedIcon type={request.needType} variant="tile" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">
                  {request.billNote || pull.noBill}
                </p>
                <p className="text-caption text-xs">{meta.label} · {member.relation}</p>
              </div>
            </div>
            <p className="detail-receipt-amount">${request.amount.toFixed(2)}</p>
          </div>
        </div>

        <div className="detail-meta-grid inbox-meta-grid">
          <MetaRow label={pull.payout} value={`${member.method} · ${member.country}`} />
          <MetaRow label={pull.fee} value="FREE" highlight />
          <MetaRow label={pull.arrives} value={pull.arrivesShort} />
        </div>

        <AnimatePresence mode="wait">
          {processing ? (
            <ProcessingOverlay key="processing" label={pull.paying(member.relation)} />
          ) : success || status === "paid" ? (
            <PaymentSuccessPanel
              key="success"
              title={pull.successTitle}
              body={pull.successBody(request.amount, member.name)}
              hint={pull.notified(member.relation)}
              settlement={displaySettlement}
              actions={[
                { label: pull.viewHistory, onClick: () => router.push("/history") },
                { label: pull.backHome, onClick: () => router.push("/dashboard"), variant: "secondary" },
              ]}
            />
          ) : status === "declined" ? (
            <motion.p key="declined" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-caption text-center py-8">
              {pull.declined}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </FlowPageBody>

      {showActions && (
        <div className="detail-actions">
          <div className="detail-actions-inner">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleApprove}
              className="btn-primary"
            >
              {pull.approve(request.amount)}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleDecline}
              className="btn-secondary w-full"
            >
              {pull.decline}
            </motion.button>
          </div>
        </div>
      )}

      <BiometricPrompt
        isOpen={showBio}
        onConfirm={onBioConfirm}
        onCancel={() => setShowBio(false)}
        context="approve"
        amount={`$${request.amount.toFixed(2)}`}
        recipient={`${member.name} (${request.title})`}
      />
    </div>
  );
}