"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("lumina_user");
    if (user) {
      const parsed = JSON.parse(user);
      setUserEmail(parsed.email);
      setUserName(parsed.email?.split("@")[0] || "User");
    }
  }, []);

  const handleLogout = async () => {
    // In production: await logout()
    localStorage.removeItem("lumina_user");
    router.push("/login");
  };

  return (
    <div className="min-h-dvh flex flex-col pb-20 gradient-mesh">
      {/* Header */}
      <div className="px-5 pt-6 pb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
      </div>

      <div className="flex-1 px-5 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 glass-light p-4 rounded-2xl"
        >
          <div className="w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center">
            <User size={24} className="text-brand-400" />
          </div>
          <div>
            <p className="text-base font-bold text-text-primary capitalize">
              {userName}
            </p>
            <p className="text-sm text-text-secondary">{userEmail}</p>
          </div>
        </motion.div>

        {/* Menu Sections */}
        <div className="space-y-4">
          <SettingsSection title="Preferences">
            <SettingsItem
              icon={<SettingsIcon size={18} />}
              label="General Settings"
            />
            <SettingsItem
              icon={<Bell size={18} />}
              label="Notifications"
            />
          </SettingsSection>

          <SettingsSection title="Security">
            <SettingsItem
              icon={<Shield size={18} />}
              label="Biometric Authentication"
              value="Enabled"
            />
            <SettingsItem
              icon={<Shield size={18} />}
              label="Wallet Address"
              value="View Details"
            />
          </SettingsSection>

          <SettingsSection title="Support">
            <SettingsItem icon={<HelpCircle size={18} />} label="Help Center" />
          </SettingsSection>
        </div>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl glass-light text-accent-coral font-medium hover:bg-surface-500/50 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1">
        {title}
      </h3>
      <div className="glass-light rounded-2xl overflow-hidden divide-y divide-surface-500/30">
        {children}
      </div>
    </motion.div>
  );
}

function SettingsItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <button className="w-full flex items-center gap-3 p-4 hover:bg-surface-500/50 transition-colors active:bg-surface-500 text-left">
      <div className="text-text-secondary">{icon}</div>
      <p className="flex-1 text-sm font-medium text-text-primary">{label}</p>
      {value && <span className="text-xs text-text-tertiary">{value}</span>}
      <ChevronRight size={16} className="text-text-tertiary" />
    </button>
  );
}
