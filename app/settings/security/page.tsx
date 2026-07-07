"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import SettingsFlowHeader from "@/components/SettingsFlowHeader";
import FlowPageBody from "@/components/FlowPageBody";
import SavedToast from "@/components/SavedToast";
import SettingsToggleRow from "@/components/SettingsToggleRow";
import MetaRow from "@/components/MetaRow";
import PageLoading from "@/components/PageLoading";
import { api } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth";
import { getPrefs, updatePrefs, type LuminaPrefs } from "@/lib/prefs";
import { security as copy } from "@/lib/copy";
import {
  detectBiometricLabel,
  getLocalPasskeyEnrolled,
  isPlatformBiometricAvailable,
  isWebAuthnSupported,
  registerPasskey,
  removePasskey,
  syncPasskeyStatus,
} from "@/lib/webauthn-client";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<LuminaPrefs>(getPrefs());
  const [saved, setSaved] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [platformAvailable, setPlatformAvailable] = useState(false);
  const label = detectBiometricLabel();

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    void (async () => {
      const supported = isWebAuthnSupported();
      setPlatformAvailable(supported && (await isPlatformBiometricAvailable()));
      const status = await syncPasskeyStatus();
      setEnrolled(status || getLocalPasskeyEnrolled());
      const statusResult = await api.webauthnStatus();
      if (statusResult.ok && statusResult.data.devices[0]) {
        setDeviceName(statusResult.data.devices[0]!);
      }
      setReady(true);
    })();
  }, [router]);

  const toggleBiometric = () => {
    const next = updatePrefs({ biometricEnabled: !prefs.biometricEnabled });
    setPrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const onEnroll = async () => {
    setEnrolling(true);
    setEnrollError(null);
    const result = await registerPasskey(label);
    setEnrolling(false);
    if (!result.ok) {
      setEnrollError(result.error);
      return;
    }
    setEnrolled(true);
    setDeviceName(label);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const onRemove = async () => {
    const ok = await removePasskey();
    if (ok) {
      setEnrolled(false);
      setDeviceName(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!ready) return <PageLoading />;

  return (
    <div className="flow-page flow-page--settings">
      <div className="content-wrap">
        <SettingsFlowHeader
          title={copy.title}
          subtitle={copy.sub}
          brandLabel={copy.brand}
          onBack={() => router.back()}
        />
      </div>

      <FlowPageBody className="space-y-4">
        <div className="settings-panel">
          <p className="settings-panel-eyebrow">{copy.panelEyebrow}</p>
          <div className="settings-panel-body divide-y divide-border-soft">
            <SettingsToggleRow
              label={label}
              sub={prefs.biometricEnabled ? copy.biometricOn(label) : copy.biometricOff}
              on={prefs.biometricEnabled}
              onToggle={toggleBiometric}
            />
          </div>
        </div>

        {prefs.biometricEnabled && platformAvailable && (
          <div className="settings-panel">
            <p className="settings-panel-eyebrow">{label}</p>
            <div className="settings-panel-body">
              {enrolled ? (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-positive/10 flex items-center justify-center">
                      <ShieldCheck size={20} className="text-positive" />
                    </div>
                    <div>
                      <p className="text-body font-medium">{copy.enrolled(label)}</p>
                      <p className="text-caption text-sm">
                        {copy.enrolledSub(deviceName ?? "this device")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onRemove()}
                    className="btn-ghost text-caption text-sm flex items-center gap-2 text-negative"
                  >
                    <Trash2 size={14} />
                    {copy.removePasskey}
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Fingerprint size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-body font-medium">{copy.enrollCta.replace("Face ID", label)}</p>
                      <p className="text-caption text-sm">{copy.enrollSub}</p>
                    </div>
                  </div>
                  {enrollError && (
                    <p className="text-caption text-xs text-negative">{enrollError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => void onEnroll()}
                    disabled={enrolling}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {copy.enrolling}
                      </>
                    ) : (
                      copy.enrollCta.replace("Face ID", label)
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="settings-meta-panel">
          <p className="settings-panel-eyebrow">{copy.metaEyebrow}</p>
          <div className="settings-meta-body">
            <MetaRow label={copy.pin} value={copy.pinValue} />
            <MetaRow label={copy.sessions} value={copy.sessionsValue} />
          </div>
        </div>

        <SavedToast message={copy.saved} visible={saved} />
      </FlowPageBody>
    </div>
  );
}