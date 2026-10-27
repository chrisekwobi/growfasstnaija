import { createFileRoute } from "@tanstack/react-router";
import { HomePage, pageHead, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/")({
  head: () => pageHead("GROW FAST | Social Media Services & Sample Rates in Naira", "Browse all sample TikTok, Instagram, Facebook, YouTube, Twitter/X and Telegram services on one page. Compare rates per 1,000 and order with Grow Fast on WhatsApp."),
  component: HomeRoute,
});

function HomeRoute() {
  return <SiteFrame><HomePage /></SiteFrame>;
}