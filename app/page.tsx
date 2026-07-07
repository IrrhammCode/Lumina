"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Repeat, Inbox, Bell } from "lucide-react";
import AuthShell from "@/components/AuthShell";
import { isLoggedIn, getPostLoginPath } from "@/lib/auth";
import { staggerContainer, staggerItem } from "@/lib/motion";
import { welcome } from "@/lib/copy";
import { preloadConnectKit } from "@/lib/connectkit-preload";
import { hasParticleConfig } from "@/lib/particle-config";

const FEATURE_ICONS = [Inbox, Repeat, Bell];

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) router.replace(getPostLoginPath());
    if (hasParticleConfig()) preloadConnectKit();
  }, [router]);

  const goLogin = () => {
    preloadConnectKit();
    router.push("/login");
  };

  return (
    <AuthShell
      variant="welcome"
      footer={
        <>
          <button type="button" onClick={goLogin} className="btn-primary py-4">
            {welcome.cta}
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            onClick={goLogin}
            className="auth-signin-link"
          >
            {welcome.signIn}
          </button>
        </>
      }
    >
      <motion.p
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="welcome-trust-pill"
      >
        {welcome.trust}
      </motion.p>
      <motion.div variants={staggerContainer} initial={false} animate="show" className="auth-feature-grid">
        {welcome.features.map((text, i) => {
          const Icon = FEATURE_ICONS[i];
          return (
            <motion.div key={text} variants={staggerItem} className="auth-feature-card">
              <span className="auth-feature-icon"><Icon size={18} /></span>
              <span className="auth-feature-text">{text}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </AuthShell>
  );
}