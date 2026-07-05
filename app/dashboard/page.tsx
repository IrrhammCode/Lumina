"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import ApproveSuccessBanner from "@/components/ApproveSuccessBanner";
import type { SettlementResult } from "@/lib/settlement";
import AppShell from "@/components/AppShell";
import BalanceCard from "@/components/BalanceCard";
import QuickActions from "@/components/QuickActions";
import RequestSpotlight from "@/components/RequestSpotlight";
import SectionHead from "@/components/SectionHead";
import BottomNav from "@/components/BottomNav";
import RuleCard from "@/components/RuleCard";
import NextRunBanner from "@/components/NextRunBanner";
import EmptyRules from "@/components/EmptyRules";
import BiometricPrompt from "@/components/BiometricPrompt";
import PageLoading from "@/components/PageLoading";
import PageEnter from "@/components/PageEnter";
import FamilyPortalCard from "@/components/FamilyPortalCard";
import { StaggerList, StaggerItem } from "@/components/StaggerList";

import { getStoredUser, isOnboarded } from "@/lib/auth";
import { home, autopilot, actions, brand } from "@/lib/copy";
import {
  getRules, getNextRule, getMonthStats, toggleRuleStatus, type AllowanceRule,
} from "@/lib/allowances";
import { getPendingRequests, approveRequest, declineRequest, type CareRequest } from "@/lib/requests";
import { formatUnifiedBalance } from "@/lib/balance";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import { settlementPaymentFields } from "@/lib/settlement";
import RequestToast from "@/components/RequestToast";
import {
  ensureAlertsInitialized,
  peekUnseenRequest,
  markRequestSeen,
} from "@/lib/requestAlerts";

export default function DashboardPage() {
  const router = useRouter();
  const { balanceUsd, isUaMode, accountInfo, settle, refreshBalance } = useLuminaUA();
  const [userName, setUserName] = useState("there");
  const [ready, setReady] = useState(false);
  const [rules, setRules] = useState<AllowanceRule[]>([]);
  const [pending, setPending] = useState<CareRequest[]>([]);
  const [nextRule, setNextRule] = useState<AllowanceRule | undefined>();
  const [stats, setStats] = useState({ total: 0, count: 0 });
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [showBio, setShowBio] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSettlement, setLastSettlement] = useState<SettlementResult | null>(null);
  const [toastRequest, setToastRequest] = useState<CareRequest | null>(null);

  const refresh = useCallback(() => {
    setRules(getRules());
    setPending(getPendingRequests());
    setNextRule(getNextRule());
    setStats(getMonthStats());
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!user?.loggedIn) { router.replace("/login"); return; }
    if (!isOnboarded()) { router.replace("/onboarding"); return; }
    setUserName(user.email?.split("@")[0] || "there");
    ensureAlertsInitialized();
    refresh();
    setReady(true);
  }, [router, refresh]);

  useEffect(() => {
    if (!ready) return;
    const unseen = peekUnseenRequest();
    if (unseen) setToastRequest(unseen);
  }, [ready, pending]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  useEffect(() => {
    const onNew = (e: Event) => {
      const req = (e as CustomEvent<CareRequest>).detail;
      if (req) setToastRequest(req);
    };
    window.addEventListener("lumina:new-request", onNew);
    return () => window.removeEventListener("lumina:new-request", onNew);
  }, []);

  const onBioConfirm = async () => {
    if (!approveId) return;
    setShowBio(false);
    const req = pending.find((r) => r.id === approveId);
    const amount = req?.amount ?? 0;
    const result = await settle(amount);
    setLastSettlement(result);
    approveRequest(approveId, settlementPaymentFields(result));
    if (req) setSuccessMsg(home.paidSuccess(req.amount, req.title));
    setApproveId(null);
    refresh();
    void refreshBalance();
    setTimeout(() => {
      setSuccessMsg(null);
      setLastSettlement(null);
    }, 6000);
  };

  const approveRequest_ = pending.find((r) => r.id === approveId);
  if (!ready) return <PageLoading />;

  const hero = (
    <div className="hero-inner dashboard-hero">
      <p className="hero-greeting capitalize">{home.greeting(userName)}</p>
      {pending.length > 0 ? (
        <span className="hero-pending-pill">
          {pending.length} {home.awaiting.toLowerCase()}
        </span>
      ) : (
        <span className="hero-tagline-pill">{brand.tagline}</span>
      )}
      <h1 className="hero-title-compact">
        {pending.length > 0 ? home.pullTitle : home.autopilotTitle}
      </h1>
      <p className="hero-subline">
        {pending.length > 0 ? home.heroSubPending : home.heroSubIdle}
      </p>
    </div>
  );

  const floating = (
    <BalanceCard
      balance={formatUnifiedBalance(balanceUsd, stats.total)}
      balanceLabel={isUaMode ? home.balanceUaLabel : home.balanceLabel}
      accountBadge={isUaMode ? (accountInfo?.useEIP7702 ? "EIP-7702 · Universal" : "Universal Account") : undefined}
      visible={balanceVisible}
      onToggle={() => setBalanceVisible(!balanceVisible)}
      stats={[
        { value: `$${stats.total.toFixed(0)}`, label: home.sentMonth },
        { value: String(stats.count), label: home.payments },
        { value: String(pending.length), label: home.awaiting },
      ]}
      highlightAwaiting={pending.length > 0}
    />
  );

  return (
    <>
      <AppShell hero={hero} floating={floating} compactHero>
        <PageEnter>
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
        </AnimatePresence>

        <AnimatePresence mode="popLayout">
          {pending.length > 0 && (
            <motion.div key="spotlight" layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <RequestSpotlight
                requests={pending}
                onApprove={(id) => { setApproveId(id); setShowBio(true); }}
                onDecline={(id) => { declineRequest(id); refresh(); }}
                onOpen={(id) => router.push(`/requests/${id}`)}
                onSeeAll={() => router.push("/requests")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <QuickActions pendingCount={pending.length} variant="row" />

        {pending.length === 0 ? (
          <section className="section-block">
            <SectionHead eyebrow={home.portalEyebrow} title={home.portalTitle} />
            <FamilyPortalCard />
          </section>
        ) : (
          <div className="mb-5">
            <FamilyPortalCard variant="compact" />
          </div>
        )}

        <section className="section-block">
          <SectionHead
            eyebrow={home.autopilotEyebrow}
            title={home.autopilotTitle}
            action={rules.length > 0 ? actions.seeAll : undefined}
            onAction={rules.length > 0 ? () => router.push("/rules") : undefined}
          />
          {nextRule && pending.length === 0 && (
            <NextRunBanner rule={nextRule} onClick={() => router.push(`/rules/${nextRule.id}`)} />
          )}
          {rules.length === 0 ? (
            <EmptyRules onCreate={() => router.push("/rules/new")} onSuggestion={(need) => router.push(`/rules/new?need=${need}`)} />
          ) : (
            <div className="rule-stack">
              <StaggerList>
                {rules.slice(0, 4).map((rule) => (
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
        </section>
        </PageEnter>
      </AppShell>

      <BiometricPrompt
        isOpen={showBio}
        onConfirm={onBioConfirm}
        onCancel={() => { setShowBio(false); setApproveId(null); }}
        context="approve"
        amount={approveRequest_ ? `$${approveRequest_.amount.toFixed(2)}` : undefined}
        recipient={approveRequest_?.title}
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

      <BottomNav />
    </>
  );
}