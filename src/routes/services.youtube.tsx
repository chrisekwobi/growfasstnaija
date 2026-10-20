import { createFileRoute } from "@tanstack/react-router";
import { pageHead, PlatformPage, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/services/youtube")({
  head: () => pageHead("YouTube Views and Subscriber Service Examples | Glow Fast", "Explore draft YouTube video visibility examples. Confirm current service details and platform compliance before ordering."),
  component: YouTubeRoute,
});

function YouTubeRoute() { return <SiteFrame><PlatformPage slug="youtube" /></SiteFrame>; }