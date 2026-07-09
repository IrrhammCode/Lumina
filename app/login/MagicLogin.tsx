"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import MagicSignInPanel from "@/components/MagicSignInPanel";
import { auth } from "@/lib/copy";
import { getMagic } from "@/lib/magic";

export default function MagicLogin() {
  const router = useRouter();

  // Magic quickstart step 2: initialize embedded wallet at login (Arbitrum One)
  useEffect(() => {
    getMagic();
  }, []);

  return (
    <AuthShell variant="login" title={auth.signIn} subtitle={auth.signInSub} onBack={() => router.back()}>
      <motion.div key="magic" initial={false} animate={{ opacity: 1, x: 0 }}>
        <MagicSignInPanel />
        <p className="auth-terms">{auth.terms}</p>
      </motion.div>
    </AuthShell>
  );
}