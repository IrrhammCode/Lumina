"use client";

import { LogOut } from "lucide-react";
import { clearStoredUser } from "@/lib/auth";
import { logoutFromServer } from "@/lib/sync";
import { useMagicWallet } from "@/app/providers/MagicWalletProvider";
import { actions } from "@/lib/copy";

export default function MagicLogoutButton({ onDone }: { onDone: () => void }) {
  const { logout } = useMagicWallet();

  const handleLogout = async () => {
    await logout();
    await logoutFromServer();
    clearStoredUser();
    onDone();
  };

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      className="btn-tertiary w-full text-negative border-negative/30 mt-2"
    >
      <LogOut size={18} />
      {actions.logOut}
    </button>
  );
}