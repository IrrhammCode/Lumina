"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Globe, Check } from "lucide-react";
import { graph } from "@/lib/copy";
import { getGraphMeta, subscribeGraphMeta, type GraphMeta } from "@/lib/graph-meta";
import { ipfsGatewayUrl, truncateCid } from "@/lib/ipfs-proof";

type IpfsGraphProofProps = {
  variant?: "card" | "compact" | "inline" | "badge";
};

function storageLabel(storage: string): string {
  if (storage === "ipfs") return graph.storageIpfs;
  if (storage === "postgres") return graph.storagePostgres;
  return graph.storageJson;
}

export default function IpfsGraphProof({ variant = "card" }: IpfsGraphProofProps) {
  const [meta, setMeta] = useState<GraphMeta | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const refresh = () => setMeta(getGraphMeta());
    refresh();
    return subscribeGraphMeta(refresh);
  }, []);

  if (!meta) return null;

  const hasCid = Boolean(meta.graphCid);
  const isIpfs = meta.storage === "ipfs";

  const handleCopy = async () => {
    if (!meta.graphCid) return;
    try {
      await navigator.clipboard.writeText(meta.graphCid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (variant === "badge") {
    if (!isIpfs) return null;
    return (
      <div className="dashboard-ipfs-badge" title={graph.dashboardBadge}>
        <Globe size={12} aria-hidden />
        <span className="badge-ipfs badge-ipfs--sm">{graph.storageIpfs}</span>
        {hasCid ? (
          <a
            href={ipfsGatewayUrl(meta.graphCid!)}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-ipfs-badge-cid"
          >
            {truncateCid(meta.graphCid!, 8, 6)}
            <ExternalLink size={10} aria-hidden />
          </a>
        ) : (
          <span className="dashboard-ipfs-badge-pending">{graph.pending}</span>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    if (!hasCid) return null;
    return (
      <a
        href={ipfsGatewayUrl(meta.graphCid!)}
        target="_blank"
        rel="noopener noreferrer"
        className="ipfs-proof-link"
      >
        <Globe size={14} />
        {graph.viewIpfs}
        <ExternalLink size={12} />
      </a>
    );
  }

  if (variant === "compact") {
    return (
      <div className="ipfs-proof-compact">
        <div className="flex items-center gap-2 flex-wrap">
          {isIpfs && <span className="badge-ipfs">{graph.storageIpfs}</span>}
          {hasCid ? (
            <a
              href={ipfsGatewayUrl(meta.graphCid!)}
              target="_blank"
              rel="noopener noreferrer"
              className="ipfs-proof-link"
            >
              <Globe size={14} />
              {truncateCid(meta.graphCid!)}
              <ExternalLink size={12} />
            </a>
          ) : (
            <span className="text-caption text-xs">{isIpfs ? graph.pending : storageLabel(meta.storage)}</span>
          )}
        </div>
        {isIpfs && <p className="text-caption text-xs mt-1">{graph.compactSub}</p>}
      </div>
    );
  }

  return (
    <div className="ipfs-proof-card">
      <div className="ipfs-proof-head">
        <span className="ipfs-proof-icon">
          <Globe size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">
            {graph.eyebrow}
          </p>
          <p className="text-sm font-bold text-ink">{graph.title}</p>
        </div>
        <span className={`badge-ipfs badge-ipfs--${meta.storage}`}>{storageLabel(meta.storage)}</span>
      </div>

      <p className="text-caption text-xs mt-3 leading-relaxed">{graph.sub}</p>

      {hasCid ? (
        <div className="ipfs-proof-cid-row mt-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-mute mb-1">{graph.cidLabel}</p>
            <code className="ipfs-proof-cid">{truncateCid(meta.graphCid!, 12, 10)}</code>
          </div>
          <button type="button" onClick={handleCopy} className="btn-ghost btn-compact" aria-label={graph.copyCid}>
            {copied ? <Check size={16} className="text-positive" /> : <Copy size={16} />}
          </button>
        </div>
      ) : (
        <p className="text-caption text-xs mt-3 italic">{isIpfs ? graph.pending : graph.localSub}</p>
      )}

      {hasCid && (
        <a
          href={ipfsGatewayUrl(meta.graphCid!)}
          target="_blank"
          rel="noopener noreferrer"
          className="ipfs-proof-link ipfs-proof-link--block mt-3"
        >
          <ExternalLink size={14} />
          {graph.viewIpfs}
        </a>
      )}
    </div>
  );
}