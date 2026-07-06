"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Bell, Shield, HelpCircle, LogOut, ChevronRight, Users, Repeat, Code2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import AppShell from "@/components/AppShell";
import LuminaLogo from "@/components/LuminaLogo";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { springSnappy } from "@/lib/motion";
import { getStoredUser, clearStoredUser } from "@/lib/auth";
import { logoutFromServer } from "@/lib/sync";
import { getFamily } from "@/lib/family";
import { getRules } from "@/lib/allowances";
import { notificationsLabel, securityLabel } from "@/lib/prefs";
import { profile, actions } from "@/lib/copy";
import PageLoading from "@/components/PageLoading";
import PageEnter from "@/components/PageEnter";
import FamilyPortalCard from "@/components/FamilyPortalCard";
import UADevPanel from "@/components/UADevPanel";
import { hasParticleConfig } from "@/lib/particle-config";

const ParticleLogoutButton = dynamic(() => import("@/components/ParticleLogoutButton"), { ssr: false });

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [familyCount, setFamilyCount] = useState(0);
  const [ruleCount, setRuleCount] = useState(0);
  const [showDev, setShowDev] = useState(false);
  const [notifyLabel, setNotifyLabel] = useState("On");
  const [securityVal, setSecurityVal] = useState("Face ID");

  useEffect(() => {
    const user = getStoredUser();
    if (!user?.loggedIn) {
      router.replace("/login");
      return;
    }
    setUserEmail(user.email || "");
    setUserName(user.email?.split("@")[0] || "User");
    setFamilyCount(getFamily().length);
    setRuleCount(getRules().length);
    setNotifyLabel(notificationsLabel());
    setSecurityVal(securityLabel());
    setReady(true);
  }, [router]);

  useEffect(() => {
    const refresh = () => {
      setNotifyLabel(notificationsLabel());
      setSecurityVal(securityLabel());
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  if (!ready) return <PageLoading />;

  return (
    <>
      <AppShell
        compactHero
        sheetClassName="settings-sheet"
        hero={
          <div className="hero-inner settings-hero">
            <span className="hero-tagline-pill">{profile.eyebrow}</span>
            <h1 className="hero-title-compact capitalize">{userName}</h1>
            <p className="hero-subline">{userEmail}</p>
          </div>
        }
      >
        <PageEnter>
        <div className="settings-group">
          <p className="settings-group-label">{profile.careGroup}</p>
          <div className="settings-list">
            <SettingsRow
              icon={<Users size={16} />}
              iconTone="care"
              label={profile.family}
              value={profile.familySub(familyCount)}
              onClick={() => router.push("/settings/family")}
            />
            <SettingsRow
              icon={<Repeat size={16} />}
              iconTone="care"
              label={profile.schedules}
              value={`${ruleCount}`}
              onClick={() => router.push("/rules")}
            />
          </div>
          <div className="settings-portal-slot">
            <FamilyPortalCard variant="compact" />
          </div>
        </div>

        <div className="settings-group">
          <p className="settings-group-label">{profile.prefsGroup}</p>
          <div className="settings-list">
            <SettingsRow
              icon={<Bell size={16} />}
              iconTone="prefs"
              label={profile.notifications}
              value={notifyLabel}
              onClick={() => router.push("/settings/notifications")}
            />
            <SettingsRow
              icon={<Shield size={16} />}
              iconTone="prefs"
              label={profile.security}
              value={securityVal}
              onClick={() => router.push("/settings/security")}
            />
          </div>
        </div>

        <div className="settings-group">
          <p className="settings-group-label">{profile.supportGroup}</p>
          <div className="settings-list">
            <SettingsRow
              icon={<HelpCircle size={16} />}
              iconTone="support"
              label={profile.help}
              onClick={() => router.push("/settings/help")}
            />
          </div>
        </div>

        <div className="settings-group">
          <button
            type="button"
            onClick={() => setShowDev(!showDev)}
            className="flex items-center gap-2 settings-group-label w-full"
          >
            <Code2 size={12} />
            {profile.dev}
            <motion.span animate={{ rotate: showDev ? 90 : 0 }} transition={springSnappy} className="ml-auto">
              <ChevronRight size={14} />
            </motion.span>
          </button>
          <AnimatePresence>
            {showDev && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <UADevPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasParticleConfig() ? (
          <ParticleLogoutButton onDone={() => router.push("/")} />
        ) : (
          <button
            type="button"
            onClick={() => { void logoutFromServer().then(() => { clearStoredUser(); router.push("/"); }); }}
            className="btn-tertiary w-full text-negative border-negative/30 mt-2"
          >
            <LogOut size={18} />
            {actions.logOut}
          </button>
        )}

        </PageEnter>

        <div className="settings-footer-mark">
          <LuminaLogo size={14} className="text-glow" />
          <p className="text-caption text-xs">{profile.footer}</p>
        </div>
      </AppShell>
      <BottomNav />
    </>
  );
}

function SettingsRow({
  icon,
  iconTone = "default",
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  iconTone?: "default" | "care" | "prefs" | "support";
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="settings-row">
      <span className={`settings-row-icon settings-row-icon--${iconTone}`}>{icon}</span>
      <span className="flex-1 text-sm font-semibold text-ink">{label}</span>
      {value && <span className="text-caption text-xs">{value}</span>}
      <ChevronRight size={16} className="text-mute" />
    </button>
  );
}

