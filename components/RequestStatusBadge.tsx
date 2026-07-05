import { pull } from "@/lib/copy";
import type { RequestStatus } from "@/lib/requests";

type RequestStatusBadgeProps = {
  status: RequestStatus;
};

const CLASS: Record<RequestStatus, string> = {
  pending: "request-status-pending",
  paid: "request-status-paid",
  declined: "request-status-declined",
};

const LABEL: Record<RequestStatus, string> = {
  pending: pull.statusPending,
  paid: pull.statusPaid,
  declined: pull.statusDeclined,
};

export default function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  return <span className={`request-status-badge ${CLASS[status]}`}>{LABEL[status]}</span>;
}