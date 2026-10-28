import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/glowfast-site";
import { AdminServices } from "@/components/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/services")({
  head: () => pageHead("Service Catalogue | GROW FAST Admin", "Manage Nitro costs, service names, overrides and pricing."),
  component: AdminServices,
});
