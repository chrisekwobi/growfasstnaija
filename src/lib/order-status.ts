export type OrderGroup = "active" | "completed" | "closed";
export type OrderTone = "info" | "warning" | "success" | "muted";

const known: Record<string, { label: string; group: OrderGroup; tone: OrderTone }> = {
  pending: { label: "Pending", group: "active", tone: "info" },
  submitting: { label: "Pending", group: "active", tone: "info" },
  processing: { label: "In progress", group: "active", tone: "warning" },
  submission_unknown: { label: "Being reviewed", group: "active", tone: "warning" },
  completed: { label: "Completed", group: "completed", tone: "success" },
  refunded: { label: "Refunded to credits", group: "closed", tone: "muted" },
  cancelled: { label: "Cancelled", group: "closed", tone: "muted" },
};

export function describeOrderStatus(status: string) {
  const match = known[status];
  if (match) return match;
  const text = status.replaceAll("_", " ").trim();
  return { label: text ? text.charAt(0).toUpperCase() + text.slice(1) : "Unknown", group: "active" as OrderGroup, tone: "muted" as OrderTone };
}

export const orderFilters = [
  { id: "all", label: "All" },
  { id: "active", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "closed", label: "Refunded or cancelled" },
] as const;

export type OrderFilter = (typeof orderFilters)[number]["id"];

export function matchesOrderFilter(status: string, filter: OrderFilter) {
  return filter === "all" || describeOrderStatus(status).group === filter;
}
