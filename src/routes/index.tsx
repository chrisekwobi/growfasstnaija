import { createFileRoute } from "@tanstack/react-router";
import { HomePage, pageHead, SiteFrame } from "@/components/glowfast-site";
import { activeServicesQuery } from "@/lib/services-query";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(activeServicesQuery),
  head: () => pageHead("GROW FAST | Social Media Services & Rates in Naira", "Browse active Grow Fast social media services. Compare rates per 1,000, create an account and confirm your order on WhatsApp."),
  component: HomeRoute,
});

function HomeRoute() {
  return <SiteFrame><HomePage /></SiteFrame>;
}