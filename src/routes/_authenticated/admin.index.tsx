import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/glowfast-site";
import { AdminOverview } from "@/components/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => pageHead("Money Overview | GROW FAST Admin", "Revenue, credits, Nitro costs and profit estimates."),
  component: AdminOverview,
});
