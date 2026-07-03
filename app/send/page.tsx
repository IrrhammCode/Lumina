"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import CostComparison from "@/components/CostComparison";
import BiometricPrompt from "@/components/BiometricPrompt";
import BottomNav from "@/components/BottomNav";

// Demo contacts
const contacts = [
  {
    id: "1",
    name: "Maria Santos",
    country: "Philippines",
    flag: "🇵🇭",
    method: "GCash",
  },
  {
    id: "2",
    name: "Priya Sharma",
    country: "India",
    flag: "🇮🇳",
    method: "Paytm",
  },
  {
    id: "3",
    name: "James Mwangi",
    country: "Kenya",
    flag: "🇰🇪",
    method: "M-Pesa",
  },
  {
    id: "4",
    name: "Ana Rodriguez",
    country: "Mexico",
    flag: "🇲🇽",
    method: "Bank Transfer",
  },
  {
    id: "5",
    name: "Anh Nguyen",
    country: "Vietnam",
    flag: "🇻🇳",
    method: "Bank Transfer",
  },
];

type Step = "recipient" | "amount" | "comparison" | "confirm" | "success";

export default function SendPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("recipient");
  const [selectedContact, setSelectedContact] = useState<
    (typeof contacts)[0] | null
  >(null);
  const [amount, setAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBiometric, setShowBiometric] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectContact = (contact: (typeof contacts)[0]) => {
    setSelectedContact(contact);
    setStep("amount");
  };

  const handleAmountNext = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setStep("comparison");
  };

  const handleConfirmSend = () => {
    setShowBiometric(true);
  };

  const handleBiometricConfirm = async () => {
    setShowBiometric(false);
    setIsProcessing(true);

    // Simulate transaction processing
    // In production: createTransfer() → signMessage() → sendTransfer()
    await new Promise((resolve) => setTimeout(resolve, 2500));

    setIsProcessing(false);
    setStep("success");
  };

  const stepTitles: Record<Step, string> = {
    recipient: "Send Money",
    amount: "Enter Amount",
    comparison: "Compare Fees",
    confirm: "Confirm",
    success: "",
  };

  const goBack = () => {
    const prevSteps: Record<Step, Step | "dashboard"> = {
      recipient: "dashboard",
      amount: "recipient",
      comparison: "amount",
      confirm: "comparison",
      success: "dashboard",
    };
    const prev = prevSteps[step];
    if (prev === "dashboard") {
      router.push("/dashboard");
    } else {
      setStep(prev);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col pb-20 gradient-mesh">
      {/* Header */}
      {step !== "success" && (
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <button
            onClick={goBack}
            className="p-2 rounded-xl hover:bg-surface-600/50 transition-colors"
          >
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <h1 className="text-lg font-bold text-text-primary">
            {stepTitles[step]}
          </h1>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 px-5">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Recipient */}
          {step === "recipient" && (
            <motion.div
              key="recipient"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or country..."
                  className="w-full py-3 pl-11 pr-4 rounded-xl bg-surface-700/60 border border-surface-500 text-text-primary placeholder-text-tertiary text-sm focus:outline-none focus:border-brand-500/50 transition-all"
                />
              </div>

              {/* Contacts */}
              <div className="space-y-2">
                {filteredContacts.map((contact, index) => (
                  <motion.button
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectContact(contact)}
                    className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl glass-light hover:bg-surface-500/50 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-surface-600 flex items-center justify-center text-xl">
                      {contact.flag}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {contact.country} · {contact.method}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-text-tertiary flex-shrink-0"
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Enter Amount */}
          {step === "amount" && selectedContact && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              {/* Recipient info */}
              <div className="flex items-center gap-2 mb-8 glass-light rounded-full px-4 py-2">
                <span className="text-lg">{selectedContact.flag}</span>
                <span className="text-sm font-medium text-text-primary">
                  {selectedContact.name}
                </span>
              </div>

              {/* Amount display */}
              <div className="text-center mb-8">
                <p className="text-xs text-text-tertiary mb-2 uppercase tracking-wider">
                  You Send
                </p>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-4xl font-bold text-text-primary">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-5xl font-bold text-text-primary bg-transparent border-none outline-none text-center w-48"
                    autoFocus
                    inputMode="decimal"
                  />
                </div>
                <p className="text-sm text-text-secondary mt-3">
                  Recipient gets:{" "}
                  <span className="text-accent-mint font-semibold">
                    ${amount || "0.00"} USD
                  </span>
                </p>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 mb-8">
                {["50", "100", "200", "500"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      amount === val
                        ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                        : "glass-light text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              {/* Continue button */}
              <button
                onClick={handleAmountNext}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full py-4 rounded-2xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 btn-shine shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:shadow-none"
              >
                Compare Fees
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 3: Fee Comparison */}
          {step === "comparison" && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <CostComparison amount={parseFloat(amount) || 0} />

              <button
                onClick={() => setStep("confirm")}
                className="w-full py-4 rounded-2xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 btn-shine shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-transform"
              >
                Send with Lumina — $0 fee
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === "confirm" && selectedContact && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Summary card */}
              <div className="glass rounded-3xl p-5 space-y-4">
                <div className="text-center pb-4 border-b border-surface-500/50">
                  <p className="text-xs text-text-tertiary mb-1">
                    Sending to {selectedContact.name}
                  </p>
                  <p className="text-3xl font-bold text-text-primary">
                    ${parseFloat(amount).toFixed(2)}
                  </p>
                  <p className="text-sm text-text-secondary mt-1">USD</p>
                </div>

                <div className="space-y-3">
                  <SummaryRow label="Recipient" value={selectedContact.name} />
                  <SummaryRow
                    label="Country"
                    value={`${selectedContact.flag} ${selectedContact.country}`}
                  />
                  <SummaryRow
                    label="Payout Method"
                    value={selectedContact.method}
                  />
                  <SummaryRow label="Fee" value="$0.00" highlight />
                  <SummaryRow
                    label="Recipient Gets"
                    value={`$${parseFloat(amount).toFixed(2)}`}
                    highlight
                  />
                  <SummaryRow label="Estimated Time" value="~10 seconds" />
                </div>
              </div>

              {/* Processing indicator */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 py-6"
                >
                  <Loader2
                    size={32}
                    className="animate-spin text-brand-400"
                  />
                  <p className="text-sm text-text-secondary">
                    Processing your transfer...
                  </p>
                </motion.div>
              )}

              {!isProcessing && (
                <button
                  onClick={handleConfirmSend}
                  className="w-full py-4 rounded-2xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 btn-shine shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-transform"
                >
                  Confirm & Send
                </button>
              )}
            </motion.div>
          )}

          {/* Step 5: Success */}
          {step === "success" && selectedContact && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center min-h-[70dvh]"
            >
              {/* Success animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.2,
                }}
                className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20"
              >
                <Check size={36} className="text-white" strokeWidth={3} />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-text-primary mb-2"
              >
                Transfer Complete! 🎉
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-text-secondary mb-2"
              >
                ${parseFloat(amount).toFixed(2)} sent to{" "}
                {selectedContact.name}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-text-tertiary mb-8"
              >
                Arrived via {selectedContact.method} in{" "}
                {selectedContact.country}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="w-full space-y-3"
              >
                <button
                  onClick={() => {
                    setStep("recipient");
                    setAmount("");
                    setSelectedContact(null);
                  }}
                  className="w-full py-3.5 rounded-2xl gradient-brand text-white font-semibold text-sm btn-shine"
                >
                  Send Another
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3.5 rounded-2xl glass-light text-text-primary font-semibold text-sm hover:bg-surface-500/50 transition-all"
                >
                  Back to Home
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Biometric confirmation */}
      <BiometricPrompt
        isOpen={showBiometric}
        onConfirm={handleBiometricConfirm}
        onCancel={() => setShowBiometric(false)}
        amount={`$${parseFloat(amount || "0").toFixed(2)}`}
        recipient={selectedContact?.name}
      />

      {step !== "success" && <BottomNav />}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span
        className={`text-sm font-medium ${
          highlight ? "text-accent-mint" : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
