import { describe, expect, it } from "vitest";
import { packages, packageOrderMessage, whatsappUrl, generalWhatsAppMessage, platformEnquiryMessage } from "@/lib/glowfast";

describe("Grow Fast WhatsApp ordering", () => {
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

  it("asks for confirmation before payment and instructions in the same WhatsApp chat", () => {
    const selected = packages[0];
    if (!selected) throw new Error("A package is required for the enquiry test");
    const message = packageOrderMessage(selected);
    expect(message.indexOf("before I pay")).toBeGreaterThan(message.indexOf("final price"));
    expect(message.indexOf("payment instructions in this WhatsApp chat")).toBeGreaterThan(message.indexOf("before I pay"));
  });

  it.each(["TikTok", "Facebook", "YouTube", "Instagram"])("preserves the %s platform in a WhatsApp enquiry", (platform) => {
    const message = new URL(whatsappUrl(platformEnquiryMessage(platform))).searchParams.get("text");
    expect(message).toContain(`about ${platform} services`);
    expect(message).toContain("payment instructions in this WhatsApp chat before I pay");
  });
});