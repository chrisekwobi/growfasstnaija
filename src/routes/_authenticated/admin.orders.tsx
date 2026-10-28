import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/glowfast-site";
import { AdminOrders } from "@/components/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => pageHead("Customer Orders | GROW FAST Admin", "Review fulfillment, customer charges and refunds."),
  component: AdminOrders,
});
