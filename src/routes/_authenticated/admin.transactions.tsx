import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/components/glowfast-site";
import { AdminTransactions } from "@/components/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/transactions")({
  head: () => pageHead("Credit Transactions | GROW FAST Admin", "Review and export the credit ledger."),
  component: AdminTransactions,
});
