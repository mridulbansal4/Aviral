/** A small status pill used across the platform for live-state signalling. */

export type Status = "ok" | "pending" | "error";

const LABELS: Record<Status, string> = {
  ok: "Operational",
  pending: "Connecting",
  error: "Unavailable",
};

export function StatusBadge({
  status,
  label,
}: {
  status: Status;
  label?: string;
}) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__dot" />
      {label ?? LABELS[status]}
    </span>
  );
}
