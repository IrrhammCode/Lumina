"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, HelpCircle } from "lucide-react";
import SettingsFlowHeader from "@/components/SettingsFlowHeader";
import FlowPageBody from "@/components/FlowPageBody";
import PageLoading from "@/components/PageLoading";
import { getStoredUser } from "@/lib/auth";
import { help as copy } from "@/lib/copy";
import { springSnappy } from "@/lib/motion";

export default function HelpSettingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    if (!getStoredUser()?.loggedIn) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

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
        <div className="settings-panel settings-faq-panel">
          <p className="settings-panel-eyebrow">{copy.faqEyebrow}</p>
          <div className="settings-panel-body settings-faq-list">
            {copy.items.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className={`settings-faq-item ${isOpen ? "open" : ""}`}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="help-faq-trigger"
                  >
                    <span className="text-sm font-semibold text-ink text-left">{item.q}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={springSnappy}>
                      <ChevronDown size={18} className="text-mute flex-shrink-0" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="help-faq-answer">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        <div className="help-contact-card settings-contact-card">
          <div className="help-contact-icon">
            <HelpCircle size={20} />
          </div>
          <p className="text-sm font-bold text-ink">{copy.contact}</p>
          <p className="text-caption text-xs mt-1">{copy.contactSub}</p>
          <a
            href="mailto:hello@lumina.app"
            className="btn-secondary w-full mt-4 inline-flex items-center justify-center gap-2"
          >
            <Mail size={16} />
            {copy.contactCta}
          </a>
        </div>
      </FlowPageBody>
    </div>
  );
}