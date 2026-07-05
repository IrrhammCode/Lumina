"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import SettingsFlowHeader from "@/components/SettingsFlowHeader";
import StickyFooter from "@/components/StickyFooter";
import { getStoredUser } from "@/lib/auth";
import { getFamily, addMember, removeMember, type FamilyMember } from "@/lib/family";
import { family, actions, portal } from "@/lib/copy";
import MemberAvatar from "@/components/MemberAvatar";
import { countryCodeFromName } from "@/lib/countries";
import PageLoading from "@/components/PageLoading";
import MemberShareButton from "@/components/MemberShareButton";
import FlowPageBody from "@/components/FlowPageBody";
import FamilyPortalCard from "@/components/FamilyPortalCard";
import SavedToast from "@/components/SavedToast";

export default function FamilySettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [country, setCountry] = useState("Philippines");
  const [method, setMethod] = useState("GCash");
  const [saved, setSaved] = useState(false);

  const refresh = () => setMembers(getFamily());

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    refresh();
    setReady(true);
  }, [router]);

  const handleAdd = () => {
    if (!name.trim()) return;
    addMember({
      name: name.trim(),
      relation: relation.trim() || "Family",
      countryCode: countryCodeFromName(country),
      country,
      method,
      currency: "USD",
    });
    setName("");
    setRelation("");
    setShowAdd(false);
    refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemove = (id: string) => {
    if (members.length <= 1) return;
    removeMember(id);
    refresh();
  };

  if (!ready) return <PageLoading />;

  return (
    <div className="flow-page flow-page--settings">
      <div className="content-wrap">
        <SettingsFlowHeader
          title={family.title}
          subtitle={family.sub(members.length)}
          brandLabel={family.brand}
          onBack={() => router.back()}
        />
      </div>

      <FlowPageBody className="space-y-5">
        <div className="settings-panel">
          <p className="settings-panel-eyebrow">{family.listEyebrow}</p>
          <div className="settings-family-list">
            <AnimatePresence initial={false}>
              {members.map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0 }}
                  className="settings-family-row"
                >
                  <MemberAvatar code={m.countryCode} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="settings-family-name">{m.name}</p>
                    <p className="settings-family-meta">{m.relation} · {m.method} · {m.country}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <MemberShareButton member={m} />
                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id)}
                        className="settings-family-remove"
                        aria-label={`${actions.remove} ${m.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showAdd ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="settings-add-panel"
            >
              <p className="field-label">{family.addForm}</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={family.namePh} className="input-field" />
              <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder={family.relationPh} className="input-field" />
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="input-field">
                <option>Philippines</option>
                <option>India</option>
                <option>Kenya</option>
                <option>Nigeria</option>
              </select>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="input-field">
                <option>GCash</option>
                <option>Paytm</option>
                <option>M-Pesa</option>
                <option>Bank transfer</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">
                  {family.cancel}
                </button>
                <button type="button" onClick={handleAdd} disabled={!name.trim()} className="btn-primary flex-1">
                  {family.save}
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="settings-portal-block">
          <p className="field-label">{portal.title}</p>
          <p className="text-caption text-xs">{family.portalHint}</p>
          <FamilyPortalCard variant="compact" />
        </div>

        <SavedToast message={family.saved} visible={saved} />
      </FlowPageBody>

      {!showAdd && (
        <StickyFooter>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="btn-tertiary w-full border-dashed settings-add-btn"
          >
            <Plus size={18} />
            {family.add}
          </button>
        </StickyFooter>
      )}
    </div>
  );
}