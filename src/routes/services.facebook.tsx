import { createFileRoute } from "@tanstack/react-router";
import { pageHead, PlatformPage, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/services/facebook")({
  head: () => pageHead("Facebook Engagement Service Examples | Glow Fast", "Review draft Facebook page engagement examples and ask Glow Fast to confirm current availability and conditions."),
  component: FacebookRoute,
});

function FacebookRoute() { return <SiteFrame><PlatformPage slug="facebook" /></SiteFrame>; }