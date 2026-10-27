import { createFileRoute } from "@tanstack/react-router";
import { HomePage, pageHead, SiteFrame } from "@/components/glowfast-site";
import { activeServicesQuery } from "@/lib/services-query";
import { orderReturnSchema } from "@/lib/order-validation";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({ order: orderReturnSchema.parse(search["order"]) }),
  loader: ({ context }) => context.queryClient.ensureQueryData(activeServicesQuery),
  head: () => pageHead("GROW FAST | Social Media Services & Rates in Naira", "Browse active Grow Fast social media services. Compare rates per 1,000, create an account and order with your credit balance."),
  component: HomeRoute,
});

function HomeRoute() {
  return <SiteFrame><HomePage /></SiteFrame>;
}