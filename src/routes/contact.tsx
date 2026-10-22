import { createFileRoute } from "@tanstack/react-router";
import { ContactPage, pageHead, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("Contact Grow Fast on WhatsApp", "Contact Grow Fast about social media services through a WhatsApp enquiry."),
  component: ContactRoute,
});

function ContactRoute() { return <SiteFrame><ContactPage /></SiteFrame>; }