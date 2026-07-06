import type { PaymentRecord } from "./allowances";
import { getPrefs } from "./prefs";
import type { CareRequest } from "./requests";
import { getMemberById } from "./family";
import { toast } from "./copy";

export function canUseBrowserNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function browserNotificationsEnabled(): boolean {
  return canUseBrowserNotifications() && Notification.permission === "granted";
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!canUseBrowserNotifications()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function notifyNewRequest(request: CareRequest): void {
  if (!getPrefs().notifyRequests) return;
  if (!browserNotificationsEnabled()) return;
  if (document.visibilityState === "visible") return;

  const member = getMemberById(request.memberId);
  const name = member?.name ?? "Family";

  try {
    const notification = new Notification(toast.newRequest(name, request.amount), {
      body: toast.newRequestSub,
      tag: `lumina-request-${request.id}`,
      icon: "/icons/lumina-192.svg",
    });
    notification.onclick = () => {
      window.focus();
      window.location.href = `/requests/${request.id}`;
      notification.close();
    };
  } catch {
    /* ignore unsupported environments */
  }
}

export function notifyAutopilotQueue(payment: PaymentRecord): void {
  if (!getPrefs().notifyAutopilot) return;
  if (!browserNotificationsEnabled()) return;
  if (document.visibilityState === "visible") return;

  const label = payment.ruleLabel ?? "Autopilot";

  try {
    const notification = new Notification(toast.autopilotQueue(label, payment.amount), {
      body: toast.autopilotQueueSub,
      tag: `lumina-autopilot-${payment.id}`,
      icon: "/icons/lumina-192.svg",
    });
    notification.onclick = () => {
      window.focus();
      window.location.href = "/dashboard";
      notification.close();
    };
  } catch {
    /* ignore unsupported environments */
  }
}