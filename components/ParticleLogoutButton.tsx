"use client";

import { LogOut } from "lucide-react";
import { useDisconnect } from "@particle-network/connectkit";
import { clearStoredUser } from "@/lib/auth";
import { actions } from "@/lib/copy";

export default function ParticleLogoutButton({ onDone }: { onDone: () => void }) {
  const { disconnectAsync } = useDisconnect();

  const handleLogout = async () => {
    try {
      await disconnectAsync();
    } catch {
      /* wallet may already be disconnected */
    }
    clearStoredUser();
    onDone();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="btn-tertiary w-full text-negative border-negative/30 mt-2"
    >
      <LogOut size={18} />
      {actions.logOut}
    </button>
  );
}