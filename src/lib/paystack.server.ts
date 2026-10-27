import { z } from "zod";
import { paystackTransactionSchema, paymentMatches } from "@/lib/topup-validation";

// Provider responses never escape to browser logs or error messages.
export async function paystackRequest(path: string, body?: Record<string, unknown>): Promise<unknown> {
  const secret = process.env["PAYSTACK_SECRET_KEY"];
  if (!secret) throw new Error("Payments are not available yet. Please try again later.");
  try {
    const response = await fetch(`https://api.paystack.co${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), redirect: "error", signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error();
    return await response.json();
  } catch { throw new Error("Paystack could not confirm this request. Please try again; do not make another payment if you were charged."); }
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