import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { topupInputSchema, topupReferenceSchema, toKobo } from "@/lib/topup-validation";

export const initializeTopup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => topupInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { paystackRequest } = await import("@/lib/paystack.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const origin = new URL(getRequest().url).origin;
    const { data: profile, error } = await context.supabase.from("profiles").select("email").eq("id", context.userId).single();
    if (error || !profile?.email) throw new Error("Your account email is unavailable. Please sign in again.");
    if (!process.env["PAYSTACK_SECRET_KEY"]) throw new Error("Payments are not available yet. Please try again later.");
    const reference = `gf_${crypto.randomUUID().replaceAll("-", "")}`;
    const amount = toKobo(data.amount);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const saved = await supabaseAdmin.from("credit_topups").insert({ reference, user_id: context.userId, email: profile.email, amount_kobo: amount, order_service_id: data.order ?? null });
    if (saved.error) throw new Error("Could not prepare your top-up. Please retry.");
    const result = z.object({ status: z.literal(true), data: z.object({ authorization_url: z.string().url(), reference: topupReferenceSchema }) }).safeParse(await paystackRequest("/transaction/initialize", { email: profile.email, amount, currency: "NGN", reference, callback_url: `${origin}/top-up/callback` }));
    if (!result.success || result.data.data.reference !== reference) throw new Error("Could not open checkout. Please retry.");
    const url = new URL(result.data.data.authorization_url);
    if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com" || url.username || url.password) throw new Error("Checkout could not be opened safely. Please retry.");
    return { authorizationUrl: url.href };
  });

export const verifyTopup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ reference: topupReferenceSchema }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { data: topup, error } = await context.supabase.from("credit_topups").select("reference,order_service_id").eq("reference", data.reference).eq("user_id", context.userId).maybeSingle();
    if (error || !topup) throw new Error("This payment is not linked to your account. Sign in with the account used to pay.");
    const { paystackRequest, settleVerifiedPayment } = await import("@/lib/paystack.server");
    const verified = z.object({ status: z.literal(true), data: z.unknown() }).safeParse(await paystackRequest(`/transaction/verify/${encodeURIComponent(data.reference)}`));
    if (!verified.success) throw new Error("Payment could not be verified yet. Please check again.");
    const result = await settleVerifiedPayment(verified.data.data);
    return { ...result, order: topup.order_service_id ?? undefined };
  });