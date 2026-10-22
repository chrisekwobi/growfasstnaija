import { createFileRoute } from "@tanstack/react-router";
import { pageHead, ServicesPage, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/services/")({
  head: () => pageHead("Social Media Services & Sample Packages | Grow Fast", "Search and compare editable sample social media service packages in Nigerian Naira. Confirm offers with Grow Fast before ordering."),
  component: ServicesRoute,
});

function ServicesRoute() {
  return <SiteFrame><ServicesPage /></SiteFrame>;
}