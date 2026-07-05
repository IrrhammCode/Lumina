"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SettingsFlowHeader from "@/components/SettingsFlowHeader";
import FlowPageBody from "@/components/FlowPageBody";
import SavedToast from "@/components/SavedToast";
import SettingsToggleRow from "@/components/SettingsToggleRow";
import MetaRow from "@/components/MetaRow";
import PageLoading from "@/components/PageLoading";
import { getStoredUser } from "@/lib/auth";
import { getPrefs, updatePrefs, type LuminaPrefs } from "@/lib/prefs";
import { security as copy } from "@/lib/copy";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [prefs, setPrefs] = useState<LuminaPrefs>(getPrefs());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const toggleBiometric = () => {
    const next = updatePrefs({ biometricEnabled: !prefs.biometricEnabled });
    setPrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
              label={copy.biometric}
              sub={copy.biometricSub}
              on={prefs.biometricEnabled}
              onToggle={toggleBiometric}
            />
          </div>
        </div>

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