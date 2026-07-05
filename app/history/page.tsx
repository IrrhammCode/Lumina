"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { History } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ActivityCard from "@/components/ActivityCard";
import ReceiptSheet from "@/components/ReceiptSheet";
import AppShell from "@/components/AppShell";
import EmptyState from "@/components/EmptyState";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { getStoredUser } from "@/lib/auth";
import { getPayments, getMonthStats, type PaymentRecord } from "@/lib/allowances";
import { history, home } from "@/lib/copy";
import PageLoading from "@/components/PageLoading";
import PageEnter from "@/components/PageEnter";

export default function HistoryPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, count: 0 });
  const [selected, setSelected] = useState<PaymentRecord | null>(null);

  const refresh = useCallback(() => {
    setPayments(getPayments());
    setStats(getMonthStats());
  }, []);

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    refresh();
    setReady(true);
  }, [router, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  if (!ready) return <PageLoading />;

  const today = payments.filter((p) => isToday(p.date));
  const yesterday = payments.filter((p) => isYesterday(p.date));
  const earlier = payments.filter((p) => !isToday(p.date) && !isYesterday(p.date));
  const pullCount = payments.filter((p) => p.type === "pull").length;
  const onChainCount = payments.filter((p) => p.settlementMode === "ua" || p.settlementExplorerUrl).length;

  return (
    <>
      <AppShell
        compactHero
        sheetClassName="history-sheet"
        hero={
          <div className="hero-inner history-hero">
            <span className="hero-tagline-pill">{history.eyebrow}</span>
            <h1 className="hero-title-compact">{history.title}</h1>
            <p className="hero-subline">{history.sub}</p>
            {payments.length > 0 && (
              <div className="hero-stat-row">
                <div className="hero-stat">
                  <p className="hero-stat-value">${stats.total.toFixed(0)}</p>
                  <p className="hero-stat-label">{history.sentMonth}</p>
                </div>
                <div className="hero-stat">
                  <p className="hero-stat-value">{pullCount}</p>
                  <p className="hero-stat-label">{history.pulls}</p>
                </div>
                {onChainCount > 0 && (
                  <div className="hero-stat">
                    <p className="hero-stat-value">{onChainCount}</p>
                    <p className="hero-stat-label">{history.onChain}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      >
        <PageEnter>
          {payments.length > 0 && (
            <div className="history-summary-strip">
              <div className="history-summary-cell">
                <p className="history-summary-value">{stats.count}</p>
                <p className="history-summary-label">{home.payments}</p>
              </div>
              <div className="history-summary-cell">
                <p className="history-summary-value">{pullCount}</p>
                <p className="history-summary-label">{history.pulls}</p>
              </div>
              {onChainCount > 0 && (
                <div className="history-summary-cell history-summary-cell--ua">
                  <p className="history-summary-value">{onChainCount}</p>
                  <p className="history-summary-label">{history.onChain}</p>
                </div>
              )}
            </div>
          )}

          <Group label={history.groups.today} items={today} onSelect={setSelected} />
          <Group label={history.groups.yesterday} items={yesterday} onSelect={setSelected} />
          <Group label={history.groups.earlier} items={earlier} onSelect={setSelected} />

          {payments.length === 0 && (
            <EmptyState
              className="mt-4"
              icon={History}
              title={history.empty}
              sub={history.emptySub}
              actions={[
                { label: history.emptyCtaPay, onClick: () => router.push("/pay") },
                { label: history.emptyCtaInbox, onClick: () => router.push("/requests"), variant: "secondary" },
              ]}
            />
          )}
        </PageEnter>
      </AppShell>

      <ReceiptSheet payment={selected} onClose={() => setSelected(null)} />
      <BottomNav />
    </>
  );
}

function isToday(iso: string) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString();
}

function isYesterday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  n.setDate(n.getDate() - 1);
  return d.toDateString() === n.toDateString();
}

function Group({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: PaymentRecord[];
  onSelect: (p: PaymentRecord) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="timeline-group">
      <p className="timeline-label">{label}</p>
      <div className="timeline-list timeline-list--cards">
        <StaggerList>
          {items.map((p) => (
            <StaggerItem key={p.id}>
              <ActivityCard payment={p} variant="timeline" onClick={() => onSelect(p)} />
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </div>
  );
}