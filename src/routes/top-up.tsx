import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFrame, pageHead } from "@/components/glowfast-site";
import { Button } from "@/components/ui/button";
import { orderReturnSchema } from "@/lib/order-validation";

export const Route = createFileRoute("/top-up")({
  validateSearch: (search: Record<string, unknown>) => ({ order: orderReturnSchema.parse(search["order"]) }),
  head: () => pageHead("Add Account Credits | GROW FAST", "Add credits for Grow Fast social media services. Online top-ups are not available yet."),
  component: TopUp,
});
function TopUp() {
  const { order } = Route.useSearch();
  return <SiteFrame><main className="page-wrap account-page"><section className="auth-panel"><h1>Add credits</h1><p>Online top-ups are coming soon. No payment is collected on this page.</p><p>Your shared credit balance will work across all supported platforms once top-ups are enabled.</p><Button asChild><Link to="/" search={{ order }}>Back to {order ? "your order" : "services"}</Link></Button></section></main></SiteFrame>;
}