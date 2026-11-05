import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { adminMutationSchema, defaultAdminSettings } from "@/lib/admin-validation";

async function requireAdmin(client: SupabaseClient<Database>, userId: string) {
  const role = await client.rpc("has_role", { _user_id: userId, _role: "admin" });
  const profile = await client.from("profiles").select("suspended").eq("id", userId).single();
  if (role.error || !role.data || profile.error || profile.data.suspended) throw new Error("Admin access required.");
}
export const checkAdminAccess = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context.supabase, context.userId); return { allowed: true };
});

export const getAdminData = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context.supabase, context.userId);
  const client = context.supabase;
  // Explicit pagination: financial totals must never silently stop at the Data API row limit.
  const orders: Database["public"]["Tables"]["orders"]["Row"][] = [];
  const profiles: Database["public"]["Tables"]["profiles"]["Row"][] = [];
  const transactions: Database["public"]["Tables"]["credit_transactions"]["Row"][] = [];
  const services: Database["public"]["Tables"]["services"]["Row"][] = [];
  const topups: Database["public"]["Tables"]["credit_topups"]["Row"][] = [];
  const audit: Database["public"]["Tables"]["admin_audit_log"]["Row"][] = [];
  await Promise.all([
    (async () => { for (let i = 0; ; i += 1000) { const r = await client.from("orders").select("*").order("created_at", { ascending: false }).order("id").range(i, i + 999); if (r.error) throw new Error("Could not load orders."); orders.push(...r.data); if (r.data.length < 1000) break; } })(),
    (async () => { for (let i = 0; ; i += 1000) { const r = await client.from("profiles").select("*").order("id").range(i, i + 999); if (r.error) throw new Error("Could not load customers."); profiles.push(...r.data); if (r.data.length < 1000) break; } })(),
    (async () => { for (let i = 0; ; i += 1000) { const r = await client.from("credit_transactions").select("*").order("created_at", { ascending: false }).order("id").range(i, i + 999); if (r.error) throw new Error("Could not load transactions."); transactions.push(...r.data); if (r.data.length < 1000) break; } })(),
    (async () => { for (let i = 0; ; i += 1000) { const r = await client.from("services").select("*").order("platform").order("id").range(i, i + 999); if (r.error) throw new Error("Could not load services."); services.push(...r.data); if (r.data.length < 1000) break; } })(),
    (async () => { for (let i = 0; ; i += 1000) { const r = await client.from("credit_topups").select("*").order("reference").range(i, i + 999); if (r.error) throw new Error("Could not load payments."); topups.push(...r.data); if (r.data.length < 1000) break; } })(),
    (async () => { for (let i = 0; ; i += 1000) { const r = await client.from("admin_audit_log").select("*").order("created_at", { ascending: false }).order("id").range(i, i + 999); if (r.error) throw new Error("Could not load audit history."); audit.push(...r.data); if (r.data.length < 1000) break; } })(),
  ]);
  const settings = await client.from("admin_settings").select("*").eq("id", 1).maybeSingle();
  if (settings.error) throw new Error("Could not load pricing settings.");
  return { orders, profiles, transactions, services, topups, audit, settings: settings.data ?? defaultAdminSettings, configured: Boolean(settings.data), serverTime: new Date().toISOString() };
});
export type AdminData = Awaited<ReturnType<typeof getAdminData>>;
export const manageAdmin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => adminMutationSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const result = await context.supabase.rpc("admin_manage", { _action: data.action, _payload: data.payload });
    if (result.error) throw new Error(result.error.message);
    return { success: true };
  });
export const getNitroBalance = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await requireAdmin(context.supabase, context.userId);
  const { nitroAdminRequest } = await import("@/lib/nitro-admin.server");
  let payload: unknown;
  try { payload = await nitroAdminRequest("balance"); } catch (error) { console.error("[nitro-balance] request failed:", error instanceof Error ? error.message : "unknown error"); throw new Error("Nitro does not report its balance through the API. Check your balance on nitro.ng."); }
  const parsed = z.object({ balance: z.coerce.number().finite().nonnegative(), currency: z.string().min(1).default("NGN") }).safeParse(payload);
  if (!parsed.success) throw new Error("Nitro does not report its balance through the API. Check your balance on nitro.ng.");
  return { ...parsed.data, checkedAt: new Date().toISOString() };
});
export const refreshNitroOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).strict().parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const order = await context.supabase.from("orders").select("nitro_order_id").eq("id", data.id).single();
    if (order.error || !order.data.nitro_order_id) throw new Error("This order has no confirmed Nitro order ID. Review it before retrying.");
    const { nitroAdminRequest } = await import("@/lib/nitro-admin.server");
    const result = z.object({ status: z.string().min(1) }).parse(await nitroAdminRequest("status", { order: order.data.nitro_order_id }));
    const normalized = result.status.toLowerCase().replaceAll(" ", "_");
    const status = ({ completed: "completed", partial: "partial", canceled: "cancelled", cancelled: "cancelled", pending: "pending", processing: "processing", in_progress: "processing" } as Record<string, string>)[normalized];
    if (!status) throw new Error("Nitro returned an unrecognized status. No local status was changed.");
    const saved = await context.supabase.rpc("admin_manage", { _action: "status", _payload: { id: data.id, status } });
    if (saved.error) throw new Error("Could not save the refreshed status.");
    return { success: true, status };
  });const nitroStatusMap: Record<string, string> = { completed: "completed", partial: "partial", canceled: "cancelled", cancelled: "cancelled", pending: "pending", processing: "processing", in_progress: "processing" };
// Unconfirmed submissions have no saved provider ID; the admin supplies the ID found in Nitro, which is verified live before linking.
export const checkUnknownOrderWithNitro = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), nitro_order_id: z.string().trim().regex(/^\d{1,20}$/, "Enter the numeric Nitro order ID.").optional() }).strict().parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const order = await context.supabase.from("orders").select("status,nitro_order_id").eq("id", data.id).single();
    if (order.error) throw new Error("Order not found.");
    if (order.data.status !== "submission_unknown") throw new Error("This order is no longer unconfirmed.");
    const nitroId = order.data.nitro_order_id ?? data.nitro_order_id;
    if (!nitroId) return { found: false as const, message: "No Nitro order ID was saved. Search Nitro for this link and enter its order ID, or refund the customer if Nitro has no matching order." };
    const { nitroAdminRequest } = await import("@/lib/nitro-admin.server");
    let raw: unknown;
    try { raw = await nitroAdminRequest("status", { order: nitroId }); } catch { return { found: false as const, message: `Nitro has no order #${nitroId} on this account, or could not be reached.` }; }
    const parsed = z.object({ status: z.string().min(1) }).safeParse(raw);
    const status = parsed.success ? nitroStatusMap[parsed.data.status.toLowerCase().replaceAll(" ", "_")] : undefined;
    if (!status) return { found: false as const, message: "Nitro returned an unrecognized status. Nothing was changed." };
    const saved = await context.supabase.rpc("admin_attach_nitro_order", { _order_id: data.id, _nitro_order_id: nitroId, _status: status });
    if (saved.error) throw new Error(saved.error.message);
    return { found: true as const, message: `Confirmed with Nitro: order #${nitroId} is ${status}.` };
  });
