import { z } from "zod";

export const topupPresets = [1000, 2000, 5000, 10000, 20000] as const;
export const topupAmountSchema = z.number().finite().min(500, "The minimum top-up is ₦500.").refine((amount) => Number.isSafeInteger(Math.round(amount * 100)) && Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001, "Enter an amount with no more than two decimal places.");
export const topupReferenceSchema = z.string().regex(/^gf_[a-f0-9]{32}$/, "This payment reference is not valid.");
export const topupInputSchema = z.object({ amount: topupAmountSchema, order: z.string().uuid().optional() }).strict();
export const toKobo = (amount: number) => Math.round(topupAmountSchema.parse(amount) * 100);
export const paystackTransactionSchema = z.object({ reference: topupReferenceSchema, amount: z.number().int().safe().positive(), currency: z.string(), status: z.string() });
export function paymentMatches(transaction: z.infer<typeof paystackTransactionSchema>, expected: { reference: string; amount_kobo: number; currency: string }) {
  return transaction.status === "success" && transaction.reference === expected.reference && transaction.amount === expected.amount_kobo && transaction.currency === expected.currency && transaction.currency === "NGN";
}
export async function validPaystackSignature(body: string, signature: string | null, secret: string) {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["verify"]);
  const bytes = Uint8Array.from(signature.match(/.{2}/g) ?? [], (pair) => parseInt(pair, 16));
  return crypto.subtle.verify("HMAC", key, bytes, new TextEncoder().encode(body));
}