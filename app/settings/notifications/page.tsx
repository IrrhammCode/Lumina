"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SettingsFlowHeader from "@/components/SettingsFlowHeader";
import FlowPageBody from "@/components/FlowPageBody";
import SavedToast from "@/components/SavedToast";
import SettingsToggleRow from "@/components/SettingsToggleRow";
import PageLoading from "@/components/PageLoading";
import { getStoredUser } from "@/lib/auth";
import { getPrefs, updatePrefs, type LuminaPrefs } from "@/lib/prefs";
import { notifications as copy } from "@/lib/copy";

export default function NotificationsSettingsPage() {
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

  const toggle = (key: keyof Pick<LuminaPrefs, "notifyRequests" | "notifyAutopilot" | "notifyPromos">) => {
    const next = updatePrefs({ [key]: !prefs[key] });
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

      <FlowPageBody>
        <div className="settings-panel">
          <p className="settings-panel-eyebrow">{copy.panelEyebrow}</p>
          <div className="settings-panel-body divide-y divide-border-soft">
            <SettingsToggleRow
              label={copy.requests}
              sub={copy.requestsSub}
              on={prefs.notifyRequests}
              onToggle={() => toggle("notifyRequests")}
            />
            <SettingsToggleRow
              label={copy.autopilot}
              sub={copy.autopilotSub}
              on={prefs.notifyAutopilot}
              onToggle={() => toggle("notifyAutopilot")}
            />
            <SettingsToggleRow
              label={copy.promos}
              sub={copy.promosSub}
              on={prefs.notifyPromos}
              onToggle={() => toggle("notifyPromos")}
            />
          </div>
        </div>

        <SavedToast message={copy.saved} visible={saved} />
      </FlowPageBody>
    </div>
  );
}