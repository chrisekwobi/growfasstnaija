import { z } from "zod";
import { paystackTransactionSchema, paymentMatches } from "@/lib/topup-validation";

// Provider responses never escape to browser logs or error messages.
export async function paystackRequest(path: string, body?: Record<string, unknown>): Promise<unknown> {
  const secret = process.env["PAYSTACK_SECRET_KEY"]?.trim();
  if (!secret) throw new Error("Payments are not available yet. Please try again later.");
  let response: Response;
  try {
    // Workers only support redirect "follow" | "manual"; "error" throws before the request is sent.
    response = await fetch(`https://api.paystack.co${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), redirect: "manual", signal: AbortSignal.timeout(20000) });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[paystack] ${path} network error: ${reason}`);
    throw new Error(`Paystack could not be reached (${reason}). Please try again; do not make another payment if you were charged.`);
  }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = json && typeof json === "object" && "message" in json ? String((json as { message: unknown }).message) : "No message";
    console.error(`[paystack] ${path} HTTP ${response.status}: ${message}`);
    throw new Error(`Paystack error ${response.status}: ${message}`);
  }
  return json;
}

export async function settleVerifiedPayment(input: unknown) {
  const transaction = paystackTransactionSchema.parse(input);
  if (transaction.status !== "success") return { success: false as const, message: "Payment is not successful yet. Check again after completing checkout." };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: expected, error } = await supabaseAdmin.from("credit_topups").select("reference,amount_kobo,currency").eq("reference", transaction.reference).maybeSingle();
  if (error) throw new Error("Could not check this payment. Please retry.");
  if (!expected || !paymentMatches(transaction, expected)) throw new Error("Payment details do not match this top-up. Please contact support.");
  const settled = await supabaseAdmin.rpc("settle_paystack_topup", { _reference: transaction.reference, _amount_kobo: transaction.amount, _currency: transaction.currency });
  if (settled.error) throw new Error("Your payment was received, but credits could not be confirmed yet. Check again or contact support.");
  const result = z.object({ balance: z.number(), amount: z.number(), already_credited: z.boolean() }).parse(settled.data);
  return { success: true as const, ...result, message: "Payment confirmed. Your credits are ready." };
}