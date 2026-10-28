import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/glowfast-site";
import { AdminUsers } from "@/components/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => pageHead("Customer Accounts | GROW FAST Admin", "Manage customer balances, histories and suspensions."),
  component: AdminUsers,
});
