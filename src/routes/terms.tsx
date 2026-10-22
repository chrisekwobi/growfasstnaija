import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, pageHead, SiteFrame } from "@/components/glowfast-site";

export const Route = createFileRoute("/terms")({
  head: () => pageHead("Terms and Conditions | Grow Fast", "Review Grow Fast's editable draft terms and service information before ordering."),
  component: TermsRoute,
});

function TermsRoute() { return <SiteFrame><LegalPage kind="terms" /></SiteFrame>; }