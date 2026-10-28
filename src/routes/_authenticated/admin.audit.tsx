import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/glowfast-site";
import { AdminAudit } from "@/components/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => pageHead("Admin Audit Log | GROW FAST Admin", "Read the history of administrative changes."),
  component: AdminAudit,
});
