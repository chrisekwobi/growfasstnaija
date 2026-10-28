import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { orderInputSchema, validateCreditOrder } from "@/lib/order-validation";

const reservationSchema = z.object({ error: z.string().optional(), insufficient: z.boolean().optional(), balance: z.number().optional(), cost: z.number().optional(), order_id: z.string().optional(), status: z.string().optional(), existing: z.boolean().optional(), nitro_service_id: z.string().optional(), platform: z.string().optional() });
export type PlaceOrderResult = { success: boolean; message: string; balance?: number | undefined; insufficient?: boolean | undefined; orderId?: string | undefined; pending?: boolean | undefined };

export const placeOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => orderInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<PlaceOrderResult> => {
    const apiUrl = process.env["NITRO_API_URL"]?.trim();
    const apiKey = process.env["NITRO_API_KEY"]?.trim();
    if (!apiUrl || !apiKey) return { success: false, message: "Ordering is temporarily unavailable. No credits were deducted." };
    let url: URL;
    try { url = new URL(apiUrl); if (url.protocol !== "https:") throw new Error(); }
    catch { return { success: false, message: "Ordering is temporarily unavailable. No credits were deducted." }; }
    const profile = await context.supabase.from("profiles").select("suspended").eq("id", context.userId).single();
    if (profile.error || profile.data.suspended) return { success: false, message: "Your account is suspended. Contact support before ordering." };
    const { data: service, error } = await context.supabase.from("services").select("platform,min_qty,max_qty,active").eq("id", data.serviceId).single();
    if (error || !service?.active) return { success: false, message: "This service is not available right now." };
    const issue = validateCreditOrder({ platform: service.platform, min: service.min_qty, max: service.max_qty }, data.quantity, data.link);
    if (issue) return { success: false, message: issue };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reserved = await supabaseAdmin.rpc("reserve_credit_order", { _user_id: context.userId, _service_id: data.serviceId, _link: data.link, _quantity: data.quantity, _request_id: data.requestId });
    if (reserved.error) return { success: false, message: "Could not reserve your order. Retry with the same form." };
    const reservation = reservationSchema.parse(reserved.data);
    if (reservation.error) return { success: false, message: reservation.error, balance: reservation.balance, insufficient: reservation.insufficient };
    const orderId = reservation.order_id;
    if (!orderId) return { success: false, message: "Could not prepare this order. Please contact support." };
    if (reservation.existing) return { success: reservation.status === "processing", orderId, balance: reservation.balance, pending: ["submitting", "submission_unknown"].includes(reservation.status ?? ""), message: reservation.status === "processing" ? "Your order was already placed successfully." : reservation.status === "refunded" ? "This order was rejected and its credits refunded." : "Your order is awaiting provider confirmation. Do not place it again; contact support." };
    // Never resend an ambiguous request: the provider may have accepted before a timeout.
    let payload: unknown;
    try {
      const response = await fetch(url, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ key: apiKey, action: "add", service: reservation.nitro_service_id ?? "", link: data.link, quantity: String(data.quantity) }), signal: AbortSignal.timeout(30000) });
      payload = await response.json();
    } catch {
      await supabaseAdmin.from("orders").update({ status: "submission_unknown" }).eq("id", orderId).eq("user_id", context.userId);
      return { success: false, pending: true, orderId, balance: reservation.balance, message: "The provider has not confirmed this order yet. Your credits are reserved; please contact support before trying again." };
    }
    const rejected = z.object({ error: z.union([z.string(), z.number()]) }).safeParse(payload);
    if (rejected.success) {
      const refund = await supabaseAdmin.rpc("refund_credit_order", { _user_id: context.userId, _order_id: orderId });
      return refund.error ? { success: false, pending: true, orderId, message: "The provider rejected the order, but your refund needs review. Please contact support." } : { success: false, orderId, balance: refund.data, message: "The provider could not accept this order. Your credits have been refunded." };
    }
    const accepted = z.object({ order: z.union([z.string().min(1), z.number().int().positive()]).transform(String) }).safeParse(payload);
    if (!accepted.success) {
      await supabaseAdmin.from("orders").update({ status: "submission_unknown" }).eq("id", orderId).eq("user_id", context.userId);
      return { success: false, pending: true, orderId, balance: reservation.balance, message: "The provider response needs review. Do not repeat this order; contact support." };
    }
    const saved = await supabaseAdmin.from("orders").update({ nitro_order_id: accepted.data.order, status: "processing" }).eq("id", orderId).eq("user_id", context.userId);
    return saved.error ? { success: false, pending: true, orderId, balance: reservation.balance, message: "Your order was accepted but its confirmation needs review. Contact support; do not order again." } : { success: true, orderId, balance: reservation.balance, message: "Order placed successfully. Your updated credit balance is shown below." };
  });