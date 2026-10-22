import { createFileRoute } from "@tanstack/react-router";
import { AboutPage, pageHead, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/about")({
  head: () => pageHead("About Grow Fast | Social Marketing Services", "Learn about Grow Fast's mission to make social media services easier to explore and enquire about."),
  component: AboutRoute,
});

function AboutRoute() { return <SiteFrame><AboutPage /></SiteFrame>; }