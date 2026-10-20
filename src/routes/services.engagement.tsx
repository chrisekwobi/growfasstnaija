import { createFileRoute } from "@tanstack/react-router";
import { pageHead, PlatformPage, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/services/engagement")({
  head: () => pageHead("Social Media Likes and Engagement Examples | Glow Fast", "Browse draft social engagement service examples and confirm platform rules, details, and availability directly with Glow Fast."),
  component: EngagementRoute,
});

function EngagementRoute() { return <SiteFrame><PlatformPage slug="engagement" /></SiteFrame>; }