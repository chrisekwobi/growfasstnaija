import { createFileRoute } from "@tanstack/react-router";
import { pageHead, PlatformPage, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/services/instagram")({
  head: () => pageHead("Instagram Marketing Service Examples | Glow Fast", "Review draft Instagram engagement package examples and ask Glow Fast to confirm current availability, pricing, and requirements."),
  component: InstagramRoute,
});

function InstagramRoute() { return <SiteFrame><PlatformPage slug="instagram" /></SiteFrame>; }