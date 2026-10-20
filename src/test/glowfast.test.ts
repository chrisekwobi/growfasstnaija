import { describe, expect, it } from "vitest";
import { packages, packageOrderMessage, whatsappUrl, generalWhatsAppMessage } from "@/lib/glowfast";

describe("Glow Fast WhatsApp ordering", () => {
  it("uses the supplied Nigerian WhatsApp number in international format", () => {
    expect(whatsappUrl(generalWhatsAppMessage)).toContain("https://wa.me/2348154776181?");
  });

  it("includes the selected package details in the encoded order enquiry", () => {
    const selected = packages.find((item) => item.id === "tt-growth");
    expect(selected).toBeDefined();
    if (!selected) return;

    const url = new URL(whatsappUrl(packageOrderMessage(selected)));
    const message = url.searchParams.get("text");
    expect(message).toContain(`Platform: ${selected.platform}`);
    expect(message).toContain(`Service: ${selected.service}`);
    expect(message).toContain(`Package: ${selected.name}`);
    expect(message).toContain(`Quantity: ${selected.quantity}`);
    expect(message).toContain("Price shown: ₦15,000");
  });
});