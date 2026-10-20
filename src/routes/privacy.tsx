import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, pageHead, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/privacy")({
  head: () => pageHead("Privacy Policy | Glow Fast", "Read Glow Fast's editable draft privacy information for WhatsApp enquiries."),
  component: PrivacyRoute,
});

function PrivacyRoute() { return <SiteFrame><LegalPage kind="privacy" /></SiteFrame>; }