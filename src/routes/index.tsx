import { createFileRoute } from "@tanstack/react-router";
import { HomePage, pageHead, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/")({
  head: () => pageHead("Grow Fast | Social Media Marketing Services in Nigeria", "Explore draft Instagram, TikTok, YouTube, Facebook, and social engagement package examples. Confirm availability and pricing with Grow Fast on WhatsApp."),
  component: HomeRoute,
});

function HomeRoute() {
  return <SiteFrame><HomePage /></SiteFrame>;
}