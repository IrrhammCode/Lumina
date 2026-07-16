"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Repeat, Clock, User } from "lucide-react";
import { springSnappy } from "@/lib/motion";
import { nav } from "@/lib/copy";
import { getPendingRequests } from "@/lib/requests";

const navItems = [
  { icon: Home, label: nav.home, href: "/dashboard" },
  { icon: Repeat, label: nav.autopilot, href: "/rules" },
  { icon: Clock, label: nav.history, href: "/history" },
  { icon: User, label: nav.profile, href: "/settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const refresh = () => setPendingCount(getPendingRequests().length);
    refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("lumina:new-request", refresh);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("lumina:new-request", refresh);
    };
  }, [pathname]);

  const hideOnWizard =
    pathname?.startsWith("/rules/new") ||
    pathname?.startsWith("/ask") ||
    pathname === "/requests/new" ||
    (pathname?.startsWith("/requests/") && pathname !== "/requests") ||
    pathname?.startsWith("/pay") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/settings/") ||
    (pathname?.startsWith("/rules/") && pathname !== "/rules");

  if (hideOnWizard) return null;

  return (
    <motion.nav
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springSnappy, delay: 0.1 }}
      className="bottom-nav bottom-nav-safe"
      aria-label="Main"
    >
      <div className="dock-shell">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="nav-tab"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="nav-active-pill"
                  transition={springSnappy}
                />
              )}
              <motion.span
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={springSnappy}
                className="relative z-[1] flex flex-col items-center gap-0.5"
              >
                <span className="nav-icon-wrap">
                  <Icon
                    size={20}
                    className={isActive ? "text-ink" : "text-mute"}
                    strokeWidth={isActive ? 2.4 : 1.8}
                  />
                  {item.href === "/dashboard" && pendingCount > 0 && (
                    <span className="nav-badge nav-badge--live" aria-label={`${pendingCount} pending`}>
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </span>
                  )}
                </span>
                <span className={`text-[9px] font-semibold ${isActive ? "text-ink" : "text-mute"}`}>
                  {item.label}
                </span>
              </motion.span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}