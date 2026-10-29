import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { pageHead } from "@/components/glowfast-site";
import { AdminOrders } from "@/components/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  validateSearch: zodValidator(z.object({ status: fallback(z.string(), "").default("") })),
  head: () => pageHead("Customer Orders | GROW FAST Admin", "Review fulfillment, customer charges and refunds."),
  component: AdminOrders,
});
