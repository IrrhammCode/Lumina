export type GraphStorageMode = "ipfs" | "json" | "postgres";

export type GraphMeta = {
  storage: GraphStorageMode;
  graphCid?: string;
  updatedAt: string;
};

const GRAPH_META_KEY = "lumina_graph_meta";
export const GRAPH_META_EVENT = "lumina:graph-meta";

function emitGraphMetaChange(): void {
  window.dispatchEvent(new Event(GRAPH_META_EVENT));
}

export function saveGraphMeta(meta: Pick<GraphMeta, "storage"> & { graphCid?: string }): void {
  if (typeof window === "undefined") return;
  const next: GraphMeta = {
    storage: meta.storage,
    graphCid: meta.graphCid,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(GRAPH_META_KEY, JSON.stringify(next));
  emitGraphMetaChange();
}

export function getGraphMeta(): GraphMeta | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GRAPH_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GraphMeta;
  } catch {
    return null;
  }
}

export function subscribeGraphMeta(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const refresh = () => onChange();
  window.addEventListener(GRAPH_META_EVENT, refresh);
  return () => window.removeEventListener(GRAPH_META_EVENT, refresh);
}

export function clearGraphMeta(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GRAPH_META_KEY);
  emitGraphMetaChange();
}