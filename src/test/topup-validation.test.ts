import { describe, expect, it } from "vitest";
import { webcrypto } from "node:crypto";
import { paymentMatches, topupAmountSchema, topupInputSchema, topupPresets, toKobo, validPaystackSignature } from "@/lib/topup-validation";

describe("Paystack top-up rules", () => {
  it("offers the five requested Naira amounts", () => expect(topupPresets).toEqual([1000, 2000, 5000, 10000, 20000]));
  it("requires at least ₦500", () => { expect(topupAmountSchema.safeParse(499.99).success).toBe(false); expect(topupAmountSchema.parse(500)).toBe(500); });
  it("converts ₦1 per credit to kobo without changing value", () => { expect(toKobo(1000)).toBe(100000); expect(toKobo(500.25) / 100).toBe(500.25); });
  it("rejects fractional kobo, nonfinite and unsafe amounts", () => { for (const amount of [500.001, Infinity, NaN, Number.MAX_SAFE_INTEGER]) expect(topupAmountSchema.safeParse(amount).success).toBe(false); });
  it("does not accept browser email, reference or user ownership", () => expect(topupInputSchema.safeParse({ amount: 1000, userId: "other", reference: "other", email: "other@example.test" }).success).toBe(false));
  it("accepts only successful matching NGN payments", () => {
    const expected = { reference: `gf_${"a".repeat(32)}`, amount_kobo: 100000, currency: "NGN" };
    const payment = { reference: expected.reference, amount: 100000, currency: "NGN", status: "success" };
    expect(paymentMatches(payment, expected)).toBe(true);
    for (const change of [{ amount: 50000 }, { currency: "USD" }, { reference: `gf_${"b".repeat(32)}` }, { status: "pending" }]) expect(paymentMatches({ ...payment, ...change }, expected)).toBe(false);
  });
  it("verifies HMAC SHA512 and rejects tampered or unsigned bodies", async () => {
    const secret = "unit-test-only-fixture";
    const body = '{"event":"charge.success"}';
    const key = await webcrypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
    const signature = Array.from(new Uint8Array(await webcrypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))), (byte) => byte.toString(16).padStart(2, "0")).join("");
    expect(await validPaystackSignature(body, signature, secret)).toBe(true);
    expect(await validPaystackSignature(body + " ", signature, secret)).toBe(false);
    expect(await validPaystackSignature(body, null, secret)).toBe(false);
  });
});