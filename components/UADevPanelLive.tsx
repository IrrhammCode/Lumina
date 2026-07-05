"use client";

import { useAccount, useModal } from "@particle-network/connectkit";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import { shortAddress } from "@/lib/format";
import { dev as copy } from "@/lib/copy";

function DevRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-caption text-sm">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export default function UADevPanelLive() {
  const { isConnected, address } = useAccount();
  const { setOpen } = useModal();
  const { isUaMode, accountInfo, balanceUsd, ready } = useLuminaUA();

  const owner = accountInfo?.ownerAddress ?? address;
  const smart = accountInfo?.evmSmartAccount;
  const eip7702Status = accountInfo?.useEIP7702
    ? accountInfo.eip7702Delegated
      ? copy.delegated
      : copy.notDelegated
    : "—";

  return (
    <div className="dev-panel card-flat p-4 text-sm space-y-1">
      <DevRow label={copy.credentials} value={copy.configured} />
      <DevRow
        label={copy.mode}
        value={isUaMode && ready ? copy.modeUa : isConnected ? "Connecting UA…" : copy.modeDemo}
      />
      {isConnected && owner ? (
        <DevRow label={copy.owner} value={shortAddress(owner)} />
      ) : (
        <DevRow label={copy.owner} value={copy.disconnected} />
      )}
      {smart && <DevRow label={copy.smartAccount} value={shortAddress(smart)} />}
      {accountInfo?.useEIP7702 && (
        <DevRow label={copy.eip7702} value={eip7702Status} />
      )}
      {balanceUsd != null && (
        <DevRow label={copy.balance} value={`$${balanceUsd.toFixed(2)}`} />
      )}
      <DevRow
        label={copy.settlement}
        value={isUaMode ? copy.settlementUa : copy.settlementDemo}
      />
      <DevRow label={copy.chain} value="Arbitrum · Base · Ethereum" />
      {!isConnected && (
        <button type="button" onClick={() => setOpen(true)} className="btn-secondary w-full mt-3 text-sm">
          {copy.connect}
        </button>
      )}
    </div>
  );
}