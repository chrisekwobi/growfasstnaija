import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/glowfast-site";
import { AdminSettings } from "@/components/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => pageHead("Pricing & Settings | GROW FAST Admin", "Manage automatic Naira pricing and payment settings."),
  component: AdminSettings,
});
