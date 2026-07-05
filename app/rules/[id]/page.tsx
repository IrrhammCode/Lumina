"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import ReceiptSheet from "@/components/ReceiptSheet";
import FlowPageBody from "@/components/FlowPageBody";
import PaymentSuccessPanel from "@/components/PaymentSuccessPanel";
import type { SettlementResult } from "@/lib/settlement";
import FlowHeader from "@/components/FlowHeader";
import MetaRow from "@/components/MetaRow";
import PageLoading from "@/components/PageLoading";
import BiometricPrompt from "@/components/BiometricPrompt";
import {
  getRuleById,
  getPayments,
  executeRule,
  type PaymentRecord,
  toggleRuleStatus,
  deleteRule,
  formatSchedule,
  formatNextRun,
  NEED_META,
} from "@/lib/allowances";
import { getMemberById } from "@/lib/family";
import { autopilot } from "@/lib/copy";
import NeedIcon from "@/components/NeedIcon";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import { settlementPaymentFields } from "@/lib/settlement";

export default function RuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { settle, refreshBalance } = useLuminaUA();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastSettlement, setLastSettlement] = useState<SettlementResult | null>(null);
  const [showBio, setShowBio] = useState(false);
  const [, setRefresh] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const rule = getRuleById(id);
  const member = rule ? getMemberById(rule.memberId) : undefined;
  const history = getPayments().filter((p) => p.ruleId === id).slice(0, 5);

  useEffect(() => {
    if (!rule) router.replace("/rules");
  }, [rule, router]);

  if (!rule || !member) return <PageLoading />;

  const ruleFresh = getRuleById(id)!;
  const meta = NEED_META[ruleFresh.needType];
  const showActions = !processing && !success;

  const handleRunNow = () => setShowBio(true);

  const onBioConfirm = async () => {
    setShowBio(false);
    setProcessing(true);
    const result = await settle(ruleFresh.amount);
    setLastSettlement(result);
    executeRule(id, settlementPaymentFields(result));
    void refreshBalance();
    setProcessing(false);
    setSuccess(true);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="flow-page">
      <div className="content-wrap">
        <FlowHeader
          title={autopilot.detailTitle}
          subtitle={`${member.name} · ${member.relation}`}
          onBack={() => router.back()}
          badge={ruleFresh.status === "active" ? <span className="badge-auto">Auto</span> : undefined}
        />
      </div>

      <div className="flow-amount-hero">
        <p className="flow-amount-value">${ruleFresh.amount.toFixed(2)}</p>
        <p className="flow-amount-label">{ruleFresh.label}</p>
      </div>

      <FlowPageBody className="space-y-4">
        <div className="flow-panel">
          <div className="flex items-center gap-4">
            <NeedIcon type={rule.needType} variant="tile" size={20} />
            <div className="flex-1">
              <p className="text-sm font-bold text-ink">{meta.label}</p>
              <p className="text-caption text-xs">{formatSchedule(ruleFresh)}</p>
            </div>
            <button
              type="button"
              className={`toggle-switch ${ruleFresh.status === "active" ? "on" : ""}`}
              onClick={() => { toggleRuleStatus(id); setRefresh((r) => r + 1); }}
              aria-label={ruleFresh.status === "active" ? autopilot.ariaPause : autopilot.ariaActivate}
            />
          </div>
        </div>

        <div className="detail-meta-grid">
          <MetaRow label={autopilot.detail.nextRun} value={formatNextRun(ruleFresh.nextRunAt)} />
          <MetaRow label={autopilot.detail.payout} value={`${member.method} · ${member.country}`} />
          <MetaRow label={autopilot.detail.fee} value="FREE" highlight />
          {ruleFresh.lastRunAt && (
            <MetaRow
              label={autopilot.detail.lastRun}
              value={new Date(ruleFresh.lastRunAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            />
          )}
        </div>

        {processing && <ProcessingOverlay label={autopilot.detail.sending} />}

        {success && (
          <PaymentSuccessPanel
            title={autopilot.detail.sentTitle}
            body={autopilot.detail.sentAmount(ruleFresh.amount, ruleFresh.label)}
            hint={autopilot.detail.sentBody(member.relation)}
            settlement={lastSettlement}
            actions={[
              { label: autopilot.detail.viewHistory, onClick: () => router.push("/history") },
              { label: autopilot.detail.backHome, onClick: () => router.push("/dashboard"), variant: "secondary" },
            ]}
          />
        )}

        {history.length > 0 && (
          <div>
            <p className="field-label mb-2 px-1">{autopilot.history}</p>
            <div className="flow-panel py-1 px-1">
              {history.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPayment(p)}
                  className="list-row w-full"
                >
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold tabular-nums">−${p.amount.toFixed(2)}</p>
                    <p className="text-caption text-xs">
                      {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-positive">{autopilot.detail.completed}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </FlowPageBody>

      {showActions && (
        <div className="detail-actions">
          <div className="detail-actions-inner">
            <button type="button" onClick={handleRunNow} className="btn-primary">
              {autopilot.runNow}
            </button>
            <button
              type="button"
              onClick={() => { deleteRule(id); router.push("/rules"); }}
              className="btn-tertiary w-full text-negative border-negative/20"
            >
              <Trash2 size={16} />
              {autopilot.delete}
            </button>
          </div>
        </div>
      )}

      <ReceiptSheet payment={selectedPayment} onClose={() => setSelectedPayment(null)} />

      <BiometricPrompt
        isOpen={showBio}
        onConfirm={onBioConfirm}
        onCancel={() => setShowBio(false)}
        context="pay"
        amount={`$${ruleFresh.amount.toFixed(2)}`}
        recipient={ruleFresh.label}
      />
    </div>
  );
}