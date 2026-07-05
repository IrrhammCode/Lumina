"use client";

import { dev as copy } from "@/lib/copy";

function DevRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-caption text-sm">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}

export default function UADevPanelDemo() {
  return (
    <div className="dev-panel card-flat p-4 text-sm space-y-1">
      <DevRow label={copy.mode} value={copy.modeDemo} />
      <DevRow label={copy.credentials} value={copy.missing} />
      <DevRow label={copy.settlement} value={copy.settlementDemo} />
      <DevRow label={copy.chain} value="Arbitrum (simulated)" />
    </div>
  );
}