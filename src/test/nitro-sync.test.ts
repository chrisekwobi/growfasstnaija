import { describe, expect, it } from "vitest";
import { describeSyncSuccess, readNitroSyncResponse } from "@/lib/nitro-sync";

const item = (over: Record<string, unknown> = {}) => ({ service: 1, name: "Followers", category: "TikTok Followers", rate: "1500.50", min: "100", max: "50000", ...over });
const reply = (status: number, body: unknown) => readNitroSyncResponse(status, typeof body === "string" ? body : JSON.stringify(body));

describe("Nitro sync response reading", () => {
  it("imports a valid catalogue and coerces string numbers", () => {
    const result = reply(200, [item(), item({ service: 2, name: "Likes", category: "Instagram Likes" })]);
    expect(result).toMatchObject({ ok: true, skipped: 0 });
    if (result.ok) expect(result.services[0]).toMatchObject({ nitro_service_id: "1", platform: "TikTok", nitro_rate_usd: 1500.5, min_qty: 100, max_qty: 50000 });
  });
  it("skips malformed entries instead of failing the whole catalogue", () => {
    const result = reply(200, [item(), item({ service: 2, min: 0 }), item({ service: 3, max: 10, min: 100 }), { junk: true }]);
    expect(result).toMatchObject({ ok: true, skipped: 3 });
    if (result.ok) expect(result.services).toHaveLength(1);
  });
  it("keeps one entry per service id so the upsert cannot hit a row twice", () => {
    const result = reply(200, [item({ name: "Old" }), item({ name: "New" })]);
    if (!result.ok) throw new Error("expected ok");
    expect(result.services).toHaveLength(1);
    expect(result.services[0]?.name).toBe("New");
  });
  it("falls back to the service name when the category has no platform", () => {
    const result = reply(200, [item({ category: "Budget", name: "YouTube Views" })]);
    if (!result.ok) throw new Error("expected ok");
    expect(result.services[0]?.platform).toBe("YouTube");
  });
  it("explains a rejected key without echoing anything secret", () => {
    const result = reply(401, { error: "Invalid API key" });
    expect(result).toEqual({ ok: false, message: "Nitro rejected the API key. Check NITRO_API_KEY and try again." });
  });
  it("reports provider errors returned with HTTP 200", () => {
    expect(reply(200, { error: "Account suspended" })).toEqual({ ok: false, message: "Nitro said: Account suspended." });
  });
  it("points at the address when the reply is not a service list", () => {
    const result = reply(200, "<html>Not the API</html>");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("NITRO_API_URL");
  });
  it("handles rate limits, server errors, empty and unusable catalogues", () => {
    expect(reply(429, {})).toMatchObject({ ok: false });
    expect(reply(500, "oops")).toEqual({ ok: false, message: "Nitro answered with HTTP 500." });
    expect(reply(200, [])).toMatchObject({ ok: false });
    expect(reply(200, [{ junk: 1 }, { junk: 2 }])).toMatchObject({ ok: false });
  });
  it("mentions skipped entries in the success message only when there are some", () => {
    expect(describeSyncSuccess(10, 0)).not.toContain("skipped");
    expect(describeSyncSuccess(10, 3)).toContain("3 entries from Nitro were skipped");
  });
});
