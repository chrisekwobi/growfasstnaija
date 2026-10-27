import { describe, expect, it } from "vitest";
import { cataloguePlatforms, catalogueServices, sampleOrderTotal, serviceOrderMessage, validateServiceOrder } from "@/lib/service-catalogue";

describe("Sample service catalogue orders", () => {
  const service = catalogueServices[0];
  if (!service) throw new Error("Missing sample service");

  it("orders platforms as TikTok, Instagram, Facebook, YouTube, then other platforms", () => {
    expect(cataloguePlatforms.map((platform) => platform.name)).toEqual(["TikTok", "Instagram", "Facebook", "YouTube", "Twitter / X", "Telegram"]);
  });

  it("calculates sample totals from a per-1,000 rate", () => {
    expect(sampleOrderTotal({ ...service, pricePerThousand: 6500 }, 1000)).toBe(6500);
    expect(sampleOrderTotal({ ...service, pricePerThousand: 6500 }, 2000)).toBe(13000);
  });

  it("enforces inclusive sample quantity limits", () => {
    expect(validateServiceOrder(service, 99, "https://www.tiktok.com/@creator")).not.toBeNull();
    expect(validateServiceOrder(service, 100, "https://www.tiktok.com/@creator")).toBeNull();
    expect(validateServiceOrder(service, 100000, "https://www.tiktok.com/@creator")).toBeNull();
    expect(validateServiceOrder(service, 100001, "https://www.tiktok.com/@creator")).not.toBeNull();
    expect(validateServiceOrder(service, 100.5, "https://www.tiktok.com/@creator")).not.toBeNull();
  });

  it("accepts public web links and rejects unsafe protocols", () => {
    expect(validateServiceOrder(service, 1000, "https://www.tiktok.com/@creator")).toBeNull();
    expect(validateServiceOrder(service, 1000, "javascript:alert(1)")).not.toBeNull();
    expect(validateServiceOrder(service, 1000, "not a link")).not.toBeNull();
  });

  it("hands the selected service, quantity, sample total, and public link to WhatsApp", () => {
    const message = serviceOrderMessage(service, 2000, "https://www.tiktok.com/@creator");
    expect(message).toContain("Platform: TikTok");
    expect(message).toContain("Quantity: 2,000");
    expect(message).toContain("Sample total: ₦13,000 (draft; please confirm)");
    expect(message).toContain("Public link: https://www.tiktok.com/@creator");
    expect(message).toContain("before I pay");
  });
});