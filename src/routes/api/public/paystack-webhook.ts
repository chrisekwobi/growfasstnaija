import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { paystackTransactionSchema, validPaystackSignature } from "@/lib/topup-validation";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: { handlers: { POST: async ({ request }) => {
    const secret = process.env["PAYSTACK_SECRET_KEY"];
    if (!secret) return new Response("Payments unavailable", { status: 503 });
    const body = await request.text();
    if (body.length > 262144) return new Response("Payload too large", { status: 413 });
    if (!await validPaystackSignature(body, request.headers.get("x-paystack-signature"), secret)) return new Response("Invalid signature", { status: 401 });
    let event: unknown;
    try { event = JSON.parse(body); } catch { return new Response("Invalid payload", { status: 400 }); }
    const envelope = z.object({ event: z.string().max(100), data: z.unknown() }).safeParse(event);
    if (!envelope.success) return new Response("Invalid event", { status: 400 });
    if (envelope.data.event !== "charge.success") return new Response("ok");
    const transaction = paystackTransactionSchema.safeParse(envelope.data.data);
    if (!transaction.success || transaction.data.status !== "success") return new Response("Invalid payment", { status: 400 });
    try {
      const { settleVerifiedPayment } = await import("@/lib/paystack.server");
      await settleVerifiedPayment(transaction.data);
      return new Response("ok");
    } catch { return new Response("Payment needs verification", { status: 503 }); }
  } } },
});