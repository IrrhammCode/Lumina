"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import Fab from "@/components/Fab";
import RuleCard from "@/components/RuleCard";
import EmptyRules from "@/components/EmptyRules";
import FilterPills from "@/components/FilterPills";
import { StaggerList, StaggerItem } from "@/components/StaggerList";
import { getStoredUser } from "@/lib/auth";
import { getRules, toggleRuleStatus, type AllowanceRule } from "@/lib/allowances";
import { autopilot } from "@/lib/copy";
import PageLoading from "@/components/PageLoading";
import PageEnter from "@/components/PageEnter";

export default function RulesPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [rules, setRules] = useState<AllowanceRule[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const refresh = useCallback(() => setRules(getRules()), []);

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    refresh();
    setReady(true);
  }, [router, refresh]);

  if (!ready) return <PageLoading />;

  const filtered = rules.filter((r) => {
    if (filter === "active") return r.status === "active";
    if (filter === "paused") return r.status === "paused";
    return true;
  });

  const activeCount = rules.filter((r) => r.status === "active").length;

  return (
    <>
      <AppShell
        compactHero
        sheetClassName="rules-sheet"
        hero={
          <div className="hero-inner rules-hero">
            <span className="hero-tagline-pill">{autopilot.eyebrow}</span>
            <h1 className="hero-title-compact">{autopilot.title}</h1>
            <p className="hero-subline">{autopilot.sub}</p>
            {rules.length > 0 && (
              <div className="hero-stat-row">
                <div className="hero-stat">
                  <p className="hero-stat-value">{activeCount}</p>
                  <p className="hero-stat-label">{autopilot.activeCount}</p>
                </div>
                <div className="hero-stat">
                  <p className="hero-stat-value">{rules.length}</p>
                  <p className="hero-stat-label">{autopilot.totalCount}</p>
                </div>
              </div>
            )}
          </div>
        }
      >
        <PageEnter>
          <div className="rules-filter-row">
            <FilterPills
              layoutId="rules-filter"
              variant="ink"
              active={filter}
              onChange={(id) => setFilter(id as typeof filter)}
              items={[
                { id: "all", label: autopilot.filters.all },
                { id: "active", label: autopilot.filters.active },
                { id: "paused", label: autopilot.filters.paused },
              ]}
            />
          </div>

          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptyRules
                  onCreate={() => router.push("/rules/new")}
                  onSuggestion={(need) => router.push(`/rules/new?need=${need}`)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="rule-stack rules-list">
                  <StaggerList>
                    {filtered.map((rule) => (
                      <StaggerItem key={rule.id}>
                        <RuleCard
                          rule={rule}
                          variant="row"
                          onToggle={(id) => {
                            toggleRuleStatus(id);
                            refresh();
                          }}
                          onClick={(id) => router.push(`/rules/${id}`)}
                        />
                      </StaggerItem>
                    ))}
                  </StaggerList>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </PageEnter>
      </AppShell>

      <Fab label={autopilot.create} onClick={() => router.push("/rules/new")} />
      <BottomNav />
    </>
  );
}