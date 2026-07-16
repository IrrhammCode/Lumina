"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import ApproveSuccessBanner from "@/components/ApproveSuccessBanner";
import SettlementErrorBanner from "@/components/SettlementErrorBanner";
import type { SettlementResult } from "@/lib/settlement";
import AppShell from "@/components/AppShell";
import BalanceCard from "@/components/BalanceCard";
import QuickActions from "@/components/QuickActions";
import RequestSpotlight from "@/components/RequestSpotlight";
import SectionHead from "@/components/SectionHead";
import BottomNav from "@/components/BottomNav";
import RuleCard from "@/components/RuleCard";
import NextRunBanner from "@/components/NextRunBanner";
import AutopilotQueueBanner from "@/components/AutopilotQueueBanner";
import EmptyRules from "@/components/EmptyRules";
import BiometricPrompt from "@/components/BiometricPrompt";
import PageLoading from "@/components/PageLoading";
import PageEnter from "@/components/PageEnter";
import FamilyPortalCard from "@/components/FamilyPortalCard";
import IpfsGraphProof from "@/components/IpfsGraphProof";
import CareCompass from "@/components/CareCompass";

import MagicMoment from "@/components/MagicMoment";
import MagicCareCard from "@/components/MagicCareCard";
import MemberAvatar from "@/components/MemberAvatar";
import BiometricEnrollBanner from "@/components/BiometricEnrollBanner";
import MagicFirstSendBanner from "@/components/MagicFirstSendBanner";
import MagicFundBanner from "@/components/MagicFundBanner";
import EmptyInbox from "@/components/EmptyInbox";
import { StaggerList, StaggerItem } from "@/components/StaggerList";

import { getStoredUser, isOnboarded } from "@/lib/auth";
import { getUserPhotoUrl } from "@/lib/user-profile";
import { home, autopilot, actions, pull, settlement } from "@/lib/copy";
import {
  getRules, getNextRule, getMonthStats, toggleRuleStatus, getPayments, formatNextRun,
  type AllowanceRule, type PaymentRecord,
} from "@/lib/allowances";
import { getFamily } from "@/lib/family";
import { getPendingRequests, approveRequest, declineRequest, type CareRequest } from "@/lib/requests";
import { formatUnifiedBalance } from "@/lib/balance";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import { settlementPaymentFields } from "@/lib/settlement";
import { confirmSettlementAfterPay } from "@/lib/settlement-poll";
import RequestToast from "@/components/RequestToast";
import {
  ensureAlertsInitialized,
  peekUnseenRequest,
  markRequestSeen,
} from "@/lib/requestAlerts";
import { hydrateFromServer, pollInbox, tickAutopilot, INBOX_POLL_MS } from "@/lib/sync";
import { requestBrowserNotificationPermission } from "@/lib/notifications";
import { getPrefs } from "@/lib/prefs";

export default function DashboardPage() {
  const router = useRouter();
  const { balanceUsd, isUaMode, isMagicMode, accountInfo, settle, refreshBalance } = useLuminaUA();
  const [userName, setUserName] = useState("there");
  const [userEmail, setUserEmail] = useState("");
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const [rules, setRules] = useState<AllowanceRule[]>([]);
  const [pending, setPending] = useState<CareRequest[]>([]);
  const [nextRule, setNextRule] = useState<AllowanceRule | undefined>();
  const [stats, setStats] = useState({ total: 0, count: 0 });
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [showBio, setShowBio] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSettlement, setLastSettlement] = useState<SettlementResult | null>(null);
  const [toastRequest, setToastRequest] = useState<CareRequest | null>(null);
  const [autopilotQueue, setAutopilotQueue] = useState<PaymentRecord | null>(null);
  const [autopilotRule, setAutopilotRule] = useState<AllowanceRule | undefined>();
  const [bioContext, setBioContext] = useState<"approve" | "pay">("approve");

  const syncAutopilotQueue = useCallback(() => {
    const queued = getPayments().find((p) => p.type === "auto" && p.status === "pending");
    setAutopilotQueue(queued ?? null);
    if (queued?.ruleId) {
      setAutopilotRule(getRules().find((r) => r.id === queued.ruleId));
    } else {
      setAutopilotRule(undefined);
    }
  }, []);

  const refresh = useCallback(() => {
    setRules(getRules());
    setPending(getPendingRequests());
    setNextRule(getNextRule());
    setStats(getMonthStats());
    syncAutopilotQueue();
  }, [syncAutopilotQueue]);

  useEffect(() => {
    void (async () => {
      const user = getStoredUser();
      if (!user?.loggedIn) { router.replace("/login"); return; }
      if (!isOnboarded()) { router.replace("/onboarding"); return; }
      setUserName(user.email?.split("@")[0] || "there");
      setUserEmail(user.email || "");
      setUserPhotoUrl(getUserPhotoUrl());
      await hydrateFromServer();
      await tickAutopilot();
      if (getPrefs().notifyRequests || getPrefs().notifyAutopilot) {
        void requestBrowserNotificationPermission();
      }
      ensureAlertsInitialized();
      refresh();
      setReady(true);
    })();
  }, [router, refresh]);

  useEffect(() => {
    if (!ready) return;
    const unseen = peekUnseenRequest();
    if (unseen) setToastRequest(unseen);
  }, [ready, pending]);

  useEffect(() => {
    if (!ready) return;
    const tick = () => {
      void (async () => {
        await tickAutopilot();
        const { pending: next } = await pollInbox();
        setPending(next);
        refresh();
      })();
    };
    tick();
    const id = setInterval(tick, INBOX_POLL_MS);
    return () => clearInterval(id);
  }, [ready, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible" || !ready) return;
      setUserPhotoUrl(getUserPhotoUrl());
      void (async () => {
        await tickAutopilot();
        const { pending: next } = await pollInbox();
        setPending(next);
        refresh();
      })();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [ready, refresh]);

  useEffect(() => {
    const onNew = (e: Event) => {
      const req = (e as CustomEvent<CareRequest>).detail;
      if (req) setToastRequest(req);
    };
    window.addEventListener("lumina:new-request", onNew);
    return () => window.removeEventListener("lumina:new-request", onNew);
  }, []);

  const onBioConfirm = async () => {
    setShowBio(false);
    setErrorMsg(null);

    try {
    if (bioContext === "pay" && autopilotQueue) {
      const result = await settle(autopilotQueue.amount);
      setLastSettlement(result);
      const confirmed = await confirmSettlementAfterPay({
        ruleId: autopilotQueue.ruleId,
        memberId: autopilotQueue.memberId,
        needType: autopilotQueue.needType,
        amount: autopilotQueue.amount,
        kind: "auto",
        settlement: settlementPaymentFields(result),
      });
      if (!confirmed.ok) {
        setErrorMsg(confirmed.reason ?? settlement.failed);
        return;
      }
      setSuccessMsg(
        autopilot.queueSuccess(autopilotRule?.label ?? autopilotQueue.ruleLabel ?? "Autopilot"),
      );
      refresh();
      void refreshBalance();
      setTimeout(() => {
        setSuccessMsg(null);
        setLastSettlement(null);
      }, 6000);
      return;
    }

    if (!approveId) return;
    const req = pending.find((r) => r.id === approveId);
    const amount = req?.amount ?? 0;
    const result = await settle(amount);
    setLastSettlement(result);
    const approved = await approveRequest(approveId, settlementPaymentFields(result));
    if (!approved.ok) {
      setErrorMsg(approved.reason ?? pull.settlementFailed);
      return;
    }
    if (req) setSuccessMsg(home.paidSuccess(req.amount, req.title));
    setApproveId(null);
    refresh();
    void refreshBalance();
    setTimeout(() => {
      setSuccessMsg(null);
      setLastSettlement(null);
    }, 6000);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : settlement.failed);
    }
  };

  const approveRequest_ = pending.find((r) => r.id === approveId);
  if (!ready) return <PageLoading />;

  const familyCount = getFamily().length;
  const idleSubline = rules.length > 0 ? home.heroSubIdle : home.heroSubNoRules;

  const hero = (
    <div className="hero-inner dashboard-hero">
      <div className="dashboard-hero-top">
        <div className="dashboard-hero-user">
          <MemberAvatar
            name={userName}
            id={userEmail || userName}
            photoUrl={userPhotoUrl}
            size="sm"
            className="dashboard-hero-avatar"
          />
          <div className="dashboard-hero-names">
            <p className="hero-greeting">{home.greetingShort}</p>
            <p className="dashboard-hero-name capitalize">{userName}</p>
          </div>
        </div>
        {pending.length > 0 && (
          <span className="hero-pending-pill">
            {pending.length} waiting
          </span>
        )}
      </div>

      <div className="dashboard-hero-focus">
        <p className="dashboard-hero-eyebrow">
          {pending.length > 0 ? home.pullEyebrow : home.autopilotEyebrow}
        </p>
        <h1 className="hero-title-compact dashboard-hero-title">
          {pending.length > 0 ? home.pullTitle : home.autopilotTitle}
        </h1>
        <p className="hero-subline dashboard-hero-subline">
          {pending.length > 0 ? home.heroSubPending : idleSubline}
        </p>
      </div>

      {pending.length === 0 && (
        <div className="dashboard-hero-chips">
          <span className="hero-chip">{home.heroChipRules(rules.length)}</span>
          {nextRule && (
            <span className="hero-chip hero-chip--gold">
              Next · {formatNextRun(nextRule.nextRunAt)}
            </span>
          )}
          <span className="hero-chip">{home.heroChipFamily(familyCount)}</span>
        </div>
      )}

      <div className="dashboard-hero-float-spacer" aria-hidden />
    </div>
  );

  const floating = (
    <BalanceCard
      balance={formatUnifiedBalance(balanceUsd)}
      balanceLabel={
        isUaMode ? home.balanceUaLabel : isMagicMode ? home.balanceMagicLabel : home.balanceLabel
      }
      accountBadge={
        isMagicMode
          ? "Magic wallet"
          : isUaMode
            ? accountInfo?.useEIP7702
              ? "EIP-7702 · Universal"
              : "Universal Account"
            : undefined
      }
      extraBadge={<IpfsGraphProof variant="badge" />}
      visible={balanceVisible}
      onToggle={() => setBalanceVisible(!balanceVisible)}
      stats={[
        { value: `$${stats.total.toFixed(0)}`, label: home.statMonth },
        { value: String(stats.count), label: home.statPayments },
        { value: String(pending.length), label: home.statAwaiting },
      ]}
      highlightAwaiting={pending.length > 0}
      tone={balanceUsd != null && balanceUsd >= 1 ? "funded" : "low"}
    />
  );

  return (
    <>
      <AppShell
        hero={hero}
        floating={floating}
        compactHero
        className={`dashboard-canvas${pending.length > 0 ? " dashboard-canvas--pending" : ""}`}
        sheetClassName="dashboard-sheet"
      >
        <PageEnter>
        <div className="dashboard-home">
        <div className="dashboard-float-clear" aria-hidden />
        <AnimatePresence>
          {successMsg && (
            <ApproveSuccessBanner
              message={successMsg}
              sub={home.paidSuccessSub}
              settlement={lastSettlement}
              onDismiss={() => {
                setSuccessMsg(null);
                setLastSettlement(null);
              }}
            />
          )}
          {errorMsg && (
            <SettlementErrorBanner
              message={errorMsg}
              onDismiss={() => {
                setErrorMsg(null);
                setLastSettlement(null);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {pending.length > 0 && (
            <motion.div key="spotlight" layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <RequestSpotlight
                compact
                requests={pending}
                onApprove={(id) => { setBioContext("approve"); setApproveId(id); setShowBio(true); }}
                onDecline={(id) => { void declineRequest(id).then((ok) => { if (ok) refresh(); }); }}
                onOpen={(id) => router.push(`/requests/${id}`)}
                onSeeAll={() => router.push("/requests")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="dashboard-zone">
          <p className="dashboard-zone-label">{home.shortcutsTitle}</p>
          <QuickActions pendingCount={pending.length} variant="dashboard" />
        </div>

        <div className="dashboard-nudges">
          <BiometricEnrollBanner />
          {isMagicMode && <MagicFundBanner />}
          {isMagicMode && <MagicFirstSendBanner paymentCount={stats.count} />}
        </div>

        <StaggerList className="dashboard-sections">
          {isMagicMode && (
            <StaggerItem>
              <section className="dashboard-section dashboard-section--wallet">
                <div className="dashboard-section-panel">
                  <MagicCareCard variant="compact" userName={userName} />
                </div>
              </section>
            </StaggerItem>
          )}

          {isMagicMode && (
            <StaggerItem>
              <section className="dashboard-section dashboard-section--compass">
                <div className="dashboard-section-panel">
                  <CareCompass isMagicMode />
                </div>
              </section>
            </StaggerItem>
          )}

          <StaggerItem>
            <section className="dashboard-section dashboard-section--portal">
              <div className="dashboard-section-panel">
                <SectionHead compact eyebrow={home.portalEyebrow} title={home.portalTitle} />
                {pending.length === 0 && <EmptyInbox variant="compact" />}
                <FamilyPortalCard variant="compact" />
              </div>
            </section>
          </StaggerItem>

          <StaggerItem>
            <section className="dashboard-section dashboard-section--autopilot">
              <div className="dashboard-section-panel">
                <SectionHead
                  compact
                  eyebrow={home.autopilotEyebrow}
                  title={home.autopilotTitle}
                  action={rules.length > 0 ? actions.seeAll : undefined}
                  onAction={rules.length > 0 ? () => router.push("/rules") : undefined}
                />
                {autopilotQueue && (
                  <div className="dashboard-banner-slot">
                    <AutopilotQueueBanner
                      payment={autopilotQueue}
                      rule={autopilotRule}
                      onSettle={() => { setBioContext("pay"); setShowBio(true); }}
                    />
                  </div>
                )}
                {nextRule && pending.length === 0 && !autopilotQueue && (
                  <NextRunBanner rule={nextRule} onClick={() => router.push(`/rules/${nextRule.id}`)} />
                )}
                {rules.length === 0 ? (
                  <EmptyRules
                    variant="compact"
                    onCreate={() => router.push("/rules/new")}
                    onSuggestion={(need) => router.push(`/rules/new?need=${need}`)}
                  />
                ) : (
                  <div className="rule-stack rule-stack-tight">
                    <StaggerList>
                      {rules.slice(0, 2).map((rule) => (
                        <StaggerItem key={rule.id}>
                          <RuleCard rule={rule} variant="row" onToggle={(id) => { toggleRuleStatus(id); refresh(); }} onClick={(id) => router.push(`/rules/${id}`)} />
                        </StaggerItem>
                      ))}
                    </StaggerList>
                    <button type="button" onClick={() => router.push("/rules/new")} className="add-rule-link">
                      <Plus size={16} />
                      {home.addRule}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </StaggerItem>
        </StaggerList>
        </div>
        </PageEnter>
      </AppShell>

      <BiometricPrompt
        isOpen={showBio}
        onConfirm={onBioConfirm}
        onCancel={() => { setShowBio(false); setApproveId(null); setBioContext("approve"); }}
        context={bioContext}
        amount={
          bioContext === "pay" && autopilotQueue
            ? `$${autopilotQueue.amount.toFixed(2)}`
            : approveRequest_
              ? `$${approveRequest_.amount.toFixed(2)}`
              : undefined
        }
        recipient={
          bioContext === "pay"
            ? autopilotRule?.label ?? autopilotQueue?.ruleLabel
            : approveRequest_?.title
        }
      />
      <AnimatePresence>
        {toastRequest && (
          <div className="request-toast-host">
            <RequestToast
              request={toastRequest}
              onView={() => {
                markRequestSeen(toastRequest.id);
                setToastRequest(null);
                router.push(`/requests/${toastRequest.id}`);
              }}
              onDismiss={() => {
                markRequestSeen(toastRequest.id);
                setToastRequest(null);
              }}
            />
          </div>
        )}
      </AnimatePresence>

      <MagicMoment ready={ready} />
      <BottomNav />
    </>
  );
}