"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe, Zap, Shield } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden">
      {/* Background gradient orbs */}
      <div className="gradient-orb w-72 h-72 bg-brand-500/30 top-[-5%] left-[-10%]" />
      <div
        className="gradient-orb w-96 h-96 bg-brand-700/20 bottom-[10%] right-[-15%]"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="gradient-orb w-48 h-48 bg-accent-sky/15 top-[40%] right-[10%]"
        style={{ animationDelay: "5s" }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-between px-6 py-12 max-w-lg mx-auto w-full">
        {/* Top section — Logo & tagline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center pt-8"
        >
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-brand mb-6 shadow-lg shadow-brand-500/20">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M16 10L22 13.5V20.5L16 24L10 20.5V13.5L16 10Z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-text-primary mb-2">
            Lumina
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Send money anywhere in the world.
            <br />
            <span className="text-brand-300 font-medium">
              Instantly. Effortlessly.
            </span>
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="space-y-4 py-8"
        >
          <FeatureRow
            icon={<Zap size={20} className="text-accent-amber" />}
            title="Lightning Fast"
            description="Arrives in seconds, not days"
          />
          <FeatureRow
            icon={<Globe size={20} className="text-accent-sky" />}
            title="Truly Global"
            description="200+ countries, any currency"
          />
          <FeatureRow
            icon={<Shield size={20} className="text-accent-mint" />}
            title="Zero Fees"
            description="No hidden charges, ever"
          />
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4"
        >
          <button
            onClick={() => router.push("/login")}
            className="w-full py-4 rounded-2xl gradient-brand text-white font-semibold text-base flex items-center justify-center gap-2 btn-shine shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-transform"
          >
            Get Started
            <ArrowRight size={18} />
          </button>

          <p className="text-center text-xs text-text-tertiary">
            No wallet needed · No crypto knowledge required
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 glass-light rounded-2xl p-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-surface-600/50 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
    </div>
  );
}
