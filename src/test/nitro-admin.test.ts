import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nitroAdminRequest } from "@/lib/nitro-admin.server";

const reply = (body: unknown, status = 200) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

describe("Nitro admin requests", () => {
  beforeEach(() => { vi.stubEnv("NITRO_API_KEY", "test-key"); vi.stubEnv("NITRO_API_URL", "https://nitro.example/api/v2"); });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("returns a normal reply that has no error field", async () => {
    reply({ balance: "5600.00", currency: "NGN" });
    await expect(nitroAdminRequest("balance")).resolves.toEqual({ balance: "5600.00", currency: "NGN" });
  });
  it("rejects a reply that carries an error field", async () => {
    reply({ error: "Incorrect request" });
    await expect(nitroAdminRequest("balance")).rejects.toThrow("did not accept");
  });
  it("rejects HTTP failures and missing configuration", async () => {
    reply({}, 500);
    await expect(nitroAdminRequest("balance")).rejects.toThrow("did not accept");
    vi.stubEnv("NITRO_API_KEY", "");
    await expect(nitroAdminRequest("balance")).rejects.toThrow("not configured");
  });
});
