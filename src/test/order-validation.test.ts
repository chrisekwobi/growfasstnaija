import { describe, expect, it } from "vitest";
import { orderCost, orderInputSchema, orderReturnSchema, platformLinkError, validateCreditOrder } from "@/lib/order-validation";

describe("Credit order validation", () => {
  it.each([
    ["TikTok", "https://www.tiktok.com/@creator/video/123456789"], ["TikTok", "https://www.tiktok.com/@creator"],
    ["Instagram", "https://www.instagram.com/p/ABC123/"], ["Instagram", "https://instagram.com/creator/"],
    ["Facebook", "https://www.facebook.com/page/posts/123"], ["Facebook", "https://facebook.com/page"],
    ["YouTube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"], ["YouTube", "https://youtube.com/@creator"],
    ["Twitter / X", "https://x.com/creator/status/123"], ["Telegram", "https://t.me/channel/123"],
  ])("accepts %s platform format %s", (platform, link) => expect(platformLinkError(platform, link)).toBeNull());
  it.each(["https://tiktok.com.evil.com/@creator", "https://evil.com/@creator", "https://www.instagram.com/p/123", "javascript:alert(1)", "https://user:pass@tiktok.com/@creator", "https://tiktok.com:8080/@creator", "https://tiktok.com/"])("rejects invalid TikTok link %s", (link) => expect(platformLinkError("TikTok", link)).not.toBeNull());
  it("validates quantity against service min and max", () => {
    const service = { platform: "TikTok", min: 100, max: 1000 };
    expect(validateCreditOrder(service, 100, "https://tiktok.com/@creator")).toBeNull();
    expect(validateCreditOrder(service, 1000, "https://tiktok.com/@creator")).toBeNull();
    for (const quantity of [99,1001,100.5]) expect(validateCreditOrder(service, quantity, "https://tiktok.com/@creator")).not.toBeNull();
  });
  it("calculates cost as quantity / 1000 times rate to two decimals", () => {
    expect(orderCost(2000, 6500)).toBe(13000);
    expect(orderCost(125, 99.99)).toBe(12.5);
  });
  it("does not accept browser prices or user IDs as order fields", () => {
    const input = orderInputSchema.parse({ serviceId: "00000000-0000-4000-8000-000000000001", requestId: "00000000-0000-4000-8000-000000000002", quantity: 100, link: "https://tiktok.com/@creator", price: 1, userId: "other" });
    expect(input).not.toHaveProperty("price"); expect(input).not.toHaveProperty("userId");
  });
  it("only preserves service UUIDs as login return destinations", () => {
    expect(orderReturnSchema.parse("https://evil.com")).toBeUndefined();
    expect(orderReturnSchema.parse("00000000-0000-4000-8000-000000000001")).toBe("00000000-0000-4000-8000-000000000001");
  });
});