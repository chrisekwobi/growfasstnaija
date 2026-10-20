import { createFileRoute } from "@tanstack/react-router";
import { FaqPage, pageHead, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/faq")({
  head: () => pageHead("FAQs | Glow Fast Social Media Services", "Read draft answers about enquiries, payment, delivery, service availability, and account safety."),
  component: FaqRoute,
});

function FaqRoute() { return <SiteFrame><FaqPage /></SiteFrame>; }