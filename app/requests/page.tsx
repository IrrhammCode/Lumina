"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Inbox, CheckCircle2, XCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import Fab from "@/components/Fab";
import FamilyPortalCard from "@/components/FamilyPortalCard";
import RequestCard from "@/components/RequestCard";
import FilterPills from "@/components/FilterPills";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { getStoredUser } from "@/lib/auth";
import { getRequests, type CareRequest } from "@/lib/requests";
import { markAllPendingSeen } from "@/lib/requestAlerts";
import { pull, history, brand } from "@/lib/copy";
import PageLoading from "@/components/PageLoading";
import PageEnter from "@/components/PageEnter";

type Tab = "pending" | "paid" | "declined";

const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: pull.tabs.pending },
  { id: "paid", label: pull.tabs.paid },
  { id: "declined", label: pull.tabs.declined },
];

const EMPTY: Record<Tab, string> = {
  pending: pull.emptyPending,
  paid: pull.emptyPaid,
  declined: pull.emptyDeclined,
};

export default function RequestsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [requests, setRequests] = useState<CareRequest[]>([]);

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    const load = () => setRequests(getRequests());
    load();
    markAllPendingSeen();
    setReady(true);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [router]);

  if (!ready) return <PageLoading />;

  const filtered = requests.filter((r) => r.status === tab);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <AppShell
        compactHero
        sheetClassName="inbox-sheet"
        hero={
          <div className="hero-inner inbox-hero">
            <button
              type="button"
              onClick={() => router.back()}
              className="inbox-hero-back"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            {pendingCount > 0 ? (
              <span className="hero-pending-pill">
                {pendingCount} {pull.waitingForYou.toLowerCase()}
              </span>
            ) : (
              <span className="hero-tagline-pill">{brand.tagline}</span>
            )}
            <h1 className="hero-title-compact">{pull.inboxTitle}</h1>
            <p className="hero-subline">{pull.inboxSub}</p>
          </div>
        }
      >
        <PageEnter>
          <div className="inbox-portal-slot">
            <FamilyPortalCard variant="compact" />
          </div>

          <div className="inbox-filter-row">
            <FilterPills
              layoutId="requests-filter"
              active={tab}
              onChange={(id) => setTab(id as Tab)}
              items={TABS.map((t) => {
                const count = requests.filter((r) => r.status === t.id).length;
                return {
                  id: t.id,
                  label: count > 0 ? `${t.label} · ${count}` : t.label,
                };
              })}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              {filtered.length > 0 ? (
                <StaggerList className="inbox-request-list">
                  {filtered.map((req) => (
                    <StaggerItem key={req.id}>
                      <RequestCard
                        request={req}
                        onOpen={(id) => router.push(`/requests/${id}`)}
                      />
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <EmptyState
                  icon={tab === "pending" ? Inbox : tab === "paid" ? CheckCircle2 : XCircle}
                  title={EMPTY[tab]}
                  actions={
                    tab === "pending"
                      ? [
                          { label: pull.emptyCtaLog, onClick: () => router.push("/requests/new") },
                          { label: pull.emptyCtaAsk, onClick: () => router.push("/ask"), variant: "secondary" },
                        ]
                      : tab === "paid"
                        ? [{ label: history.emptyCtaPay, onClick: () => router.push("/pay") }]
                        : undefined
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </PageEnter>
      </AppShell>

      <Fab label={pull.newCta} onClick={() => router.push("/requests/new")} />
      <BottomNav />
    </>
  );
}