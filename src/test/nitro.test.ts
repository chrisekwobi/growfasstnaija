import { describe, expect, it } from "vitest";
import { parseNitroServices, serviceEditsSchema } from "@/lib/nitro";

describe("Nitro service synchronization", () => {
  it("imports provider metadata without owner-controlled pricing fields", () => {
    const [row] = parseNitroServices([{ service: 123, name: "TikTok views", category: "TikTok Views", rate: "0.25", min: "100", max: "100000" }]);
    expect(row).toEqual({ nitro_service_id: "123", name: "TikTok views", category: "TikTok Views", platform: "TikTok", nitro_rate_usd: 0.25, min_qty: 100, max_qty: 100000 });
    expect(row).not.toHaveProperty("price_per_1000_ngn");
    expect(row).not.toHaveProperty("markup_percent");
    expect(row).not.toHaveProperty("active");
  });
  it("rejects invalid provider quantity limits before any import", () => {
    expect(() => parseNitroServices([{ service: 123, name: "Views", category: "TikTok", rate: 1, min: 100, max: 99 }])).toThrow();
  });
  const base = { id: "00000000-0000-4000-8000-000000000001", price_per_1000_ngn: 5000, markup_percent: 25, min_qty: 100, max_qty: 100000, active: true };
  it("allows positive prices and inclusive quantity limits", () => {
    expect(serviceEditsSchema.parse(base)).toEqual(base);
    expect(serviceEditsSchema.safeParse({ ...base, max_qty: 100 }).success).toBe(true);
    expect(serviceEditsSchema.safeParse({ ...base, max_qty: 99 }).success).toBe(false);
  });
  it("rejects activating an unpriced service", () => {
    expect(serviceEditsSchema.safeParse({ ...base, price_per_1000_ngn: 0 }).success).toBe(false);
    expect(serviceEditsSchema.safeParse({ ...base, price_per_1000_ngn: 0, active: false }).success).toBe(true);
  });
});