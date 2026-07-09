"use client";

import { Loader2 } from "lucide-react";

export default function PageLoading() {
  return (
    <div className="page-canvas page-loading" role="status" aria-label="Loading">
      <Loader2 size={32} className="animate-spin text-glow" aria-hidden />
      <p className="text-caption text-sm">Loading…</p>
    </div>
  );
}