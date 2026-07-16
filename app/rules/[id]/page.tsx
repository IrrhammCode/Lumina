"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import ReceiptSheet from "@/components/ReceiptSheet";
import FlowPageBody from "@/components/FlowPageBody";
import PaymentSuccessPanel from "@/components/PaymentSuccessPanel";
import type { SettlementResult } from "@/lib/settlement";
import AutopilotFlowHeader from "@/components/AutopilotFlowHeader";
import MetaRow from "@/components/MetaRow";
import PageLoading from "@/components/PageLoading";
import BiometricPrompt from "@/components/BiometricPrompt";
import MemberAvatar from "@/components/MemberAvatar";
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
import { autopilot, fees, settlement } from "@/lib/copy";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setErrorMsg(null);
    setProcessing(true);
    const result = await settle(ruleFresh.amount);
    setLastSettlement(result);
    const payment = await executeRule(id, settlementPaymentFields(result));
    void refreshBalance();
    setProcessing(false);
    if (!payment) {
      setErrorMsg(settlement.failed);
      return;
    }
    setSuccess(true);
    setRefresh((r) => r + 1);
  };

  return (
    <div className={`flow-page flow-page--autopilot ${ruleFresh.status === "active" ? "flow-page--autopilot-live" : ""}`}>
      <div className="content-wrap">
        <AutopilotFlowHeader
          title={autopilot.detailTitle}
          subtitle={`${member.name} · ${member.relation}`}
          brandLabel={autopilot.brand}
          onBack={() => router.back()}
          badge={
            ruleFresh.status === "active" ? (
              <span className="badge-auto">Auto</span>
            ) : (
              <span className="badge-manual">{autopilot.paused}</span>
            )
          }
        />
      </div>

      <div className="autopilot-detail-hero">
        <div className="autopilot-detail-member">
          <MemberAvatar name={member.name} id={member.id} code={member.countryCode} photoUrl={member.photoUrl} size="lg" />
          <div>
            <p className="autopilot-detail-amount">${ruleFresh.amount.toFixed(2)}</p>
            <p className="autopilot-detail-label">{ruleFresh.label}</p>
          </div>
        </div>
        <p className="autopilot-detail-meta">{formatSchedule(ruleFresh)} · {formatNextRun(ruleFresh.nextRunAt)}</p>
      </div>

      <FlowPageBody className="space-y-4">
        <div className="settings-panel autopilot-schedule-panel">
          <p className="settings-panel-eyebrow">{autopilot.detail.schedule}</p>
          <div className="settings-panel-body">
            <div className="autopilot-schedule-row">
              <NeedIcon type={rule.needType} variant="tile" size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink">{meta.label}</p>
                <p className="text-caption text-xs">{formatSchedule(ruleFresh)}</p>
              </div>
              <button
                type="button"
                className={`toggle-switch ${ruleFresh.status === "active" ? "on" : ""}`}
                onClick={() => {
                  toggleRuleStatus(id);
                  setRefresh((r) => r + 1);
                }}
                aria-label={ruleFresh.status === "active" ? autopilot.ariaPause : autopilot.ariaActivate}
              />
            </div>
          </div>
        </div>

        <div className="settings-meta-panel autopilot-meta-panel">
          <p className="settings-panel-eyebrow">{autopilot.detail.payout}</p>
          <div className="settings-meta-body">
            <MetaRow label={autopilot.detail.nextRun} value={formatNextRun(ruleFresh.nextRunAt)} />
            <MetaRow label={autopilot.detail.payout} value={`${member.method} · ${member.country}`} />
            <MetaRow label={autopilot.detail.fee} value={fees.free} highlight />
            {ruleFresh.lastRunAt && (
              <MetaRow
                label={autopilot.detail.lastRun}
                value={new Date(ruleFresh.lastRunAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              />
            )}
          </div>
        </div>

        {errorMsg && (
          <p className="text-sm font-medium text-negative text-center py-2">{errorMsg}</p>
        )}

        {processing && <ProcessingOverlay label={settlement.confirming} />}

        {success && (
          <PaymentSuccessPanel
            title={autopilot.detail.sentTitle}
            body={autopilot.detail.sentAmount(ruleFresh.amount, ruleFresh.label)}
            hint={autopilot.detail.sentBody(member.relation)}
            settlement={lastSettlement}
            panel
            actions={[
              { label: autopilot.detail.viewHistory, onClick: () => router.push("/history") },
              { label: autopilot.detail.backHome, onClick: () => router.push("/dashboard"), variant: "secondary" },
            ]}
          />
        )}

        {history.length > 0 && (
          <div className="settings-panel">
            <p className="settings-panel-eyebrow">{autopilot.history}</p>
            <div className="autopilot-history-list">
              {history.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPayment(p)}
                  className="autopilot-history-row"
                >
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold tabular-nums">−${p.amount.toFixed(2)}</p>
                    <p className="text-caption text-xs">
                      {new Date(p.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
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
              onClick={() => {
                deleteRule(id);
                router.push("/rules");
              }}
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
        context="activate"
        amount={`$${ruleFresh.amount.toFixed(2)}`}
        recipient={ruleFresh.label}
      />
    </div>
  );
}