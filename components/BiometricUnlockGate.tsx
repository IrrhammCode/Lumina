"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Loader2 } from "lucide-react";
import { isLoggedIn } from "@/lib/auth";
import {
  isBiometricUnlockRequired,
  isBiometricUnlocked,
  setBiometricUnlocked,
} from "@/lib/biometric-unlock";
import { bio } from "@/lib/copy";
import { sheetBackdrop, sheetPanel, springSnappy } from "@/lib/motion";
import {
  authenticatePasskey,
  detectBiometricLabel,
  getLocalPasskeyEnrolled,
  isPlatformBiometricAvailable,
  syncPasskeyStatus,
} from "@/lib/webauthn-client";

const PUBLIC_PATHS = ["/login", "/portal", "/ask"];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export default function BiometricUnlockGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [locked, setLocked] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = detectBiometricLabel();

  const checkLock = useCallback(async () => {
    if (!isLoggedIn() || isPublicPath(pathname)) {
      setLocked(false);
      return;
    }

    await syncPasskeyStatus();

    if (!getLocalPasskeyEnrolled() || isBiometricUnlocked()) {
      setLocked(false);
      return;
    }

    setLocked(isBiometricUnlockRequired());
  }, [pathname]);

  useEffect(() => {
    void checkLock();
  }, [checkLock]);

  useEffect(() => {
    const onLogin = () => void checkLock();
    window.addEventListener("lumina:login", onLogin);
    return () => window.removeEventListener("lumina:login", onLogin);
  }, [checkLock]);

  const runUnlock = useCallback(async () => {
    setScanning(true);
    setError(null);

    const available = await isPlatformBiometricAvailable();
    if (!available) {
      setBiometricUnlocked();
      setLocked(false);
      setScanning(false);
      return;
    }

    const result = await authenticatePasskey("unlock");
    setScanning(false);

    if (result.ok) {
      setBiometricUnlocked();
      setLocked(false);
      return;
    }

    setError(result.error);
  }, []);

  useEffect(() => {
    if (locked && !scanning) {
      const t = setTimeout(() => void runUnlock(), 400);
      return () => clearTimeout(t);
    }
  }, [locked, scanning, runUnlock]);

  const onSignOut = () => {
    router.replace("/login");
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {locked && (
          <motion.div
            variants={sheetBackdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-canvas-soft/95 backdrop-blur-md"
          >
            <motion.div
              variants={sheetPanel}
              initial="hidden"
              animate="show"
              exit="exit"
              className="bio-sheet w-full max-w-sm card mx-6 p-8 text-center space-y-5"
            >
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                {scanning && (
                  <>
                    <motion.span
                      className="bio-ring bio-ring-1"
                      animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                    />
                    <motion.span
                      className="bio-ring bio-ring-2"
                      animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.35 }}
                    />
                  </>
                )}
                <motion.div
                  animate={{ scale: scanning ? 0.96 : 1 }}
                  transition={springSnappy}
                  className="relative z-[1] w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary"
                >
                  {scanning ? (
                    <Loader2 size={28} className="animate-spin" />
                  ) : (
                    <Fingerprint size={28} />
                  )}
                </motion.div>
              </div>

              <div>
                <h2 className="text-title text-lg">{bio.unlock.title}</h2>
                <p className="text-caption text-sm mt-1">
                  {scanning ? bio.verifying(label) : bio.tapBiometric(label)}
                </p>
              </div>

              {error && (
                <p className="text-caption text-xs text-negative">{error}</p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void runUnlock()}
                  disabled={scanning}
                  className="btn-primary w-full"
                >
                  {scanning ? bio.scanning : bio.tapBiometric(label)}
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="btn-ghost text-caption text-sm"
                >
                  Sign in again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}