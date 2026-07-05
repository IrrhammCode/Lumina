import type { CareRequest } from "./requests";

export function emitNewRequest(request: CareRequest): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lumina:new-request", { detail: request }));
}