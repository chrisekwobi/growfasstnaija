import { createFileRoute } from "@tanstack/react-router";
import { pageHead, PlatformPage, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/services/tiktok")({
  head: () => pageHead("TikTok Views and Marketing Service Examples | Glow Fast", "Explore draft TikTok visibility package examples and confirm availability, price, and delivery details with Glow Fast."),
  component: TikTokRoute,
});

function TikTokRoute() { return <SiteFrame><PlatformPage slug="tiktok" /></SiteFrame>; }