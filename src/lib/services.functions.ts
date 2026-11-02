import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { serviceEditsSchema } from "@/lib/nitro";
import { describeSyncSuccess, readNitroSyncResponse } from "@/lib/nitro-sync";

export const listActiveServices = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Service catalogue is unavailable. Please try again.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const rows: Pick<Database["public"]["Tables"]["services"]["Row"], "id" | "name" | "platform" | "category" | "price_per_1000_ngn" | "min_qty" | "max_qty">[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from("services").select("id,name,platform,category,price_per_1000_ngn,min_qty,max_qty").eq("active", true).order("id").range(offset, offset + 999);
    if (error) throw new Error("Service catalogue is unavailable. Please try again.");
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
});

export const getAdminServices = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (role.error || !role.data) throw new Error("Admin access required.");
  const rows: Database["public"]["Tables"]["services"]["Row"][] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await context.supabase.from("services").select("*").order("platform").order("id").range(offset, offset + 999);
    if (error) throw new Error("Could not load services.");
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
});

export const updateAdminService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => serviceEditsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (role.error || !role.data) throw new Error("Admin access required.");
    const { id, ...edits } = data;
    const result = await context.supabase.from("services").update({ ...edits, price_override_ngn: edits.price_per_1000_ngn, markup_override: true }).eq("id", id).select("id").single();
    if (result.error) throw new Error("Could not save this service.");
    return { success: true };
  });

// sync-nitro-services: app-internal Cloud function, never a browser provider call.
export const syncNitroServices = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (role.error || !role.data) throw new Error("Admin access required.");
  const profile = await context.supabase.from("profiles").select("suspended").eq("id", context.userId).single();
  if (profile.error || profile.data.suspended) throw new Error("Admin access required.");
  const apiUrl = process.env["NITRO_API_URL"]?.trim();
  const apiKey = process.env["NITRO_API_KEY"]?.trim();
  const failed = (message: string) => ({ success: false, count: 0, message: `${message} Existing services were not changed.` });
  if (!apiUrl || !apiKey) return failed("Add NITRO_API_URL and NITRO_API_KEY to your secrets (or .env.local when running locally).");
  let url: URL;
  try { url = new URL(apiUrl); } catch { return failed("NITRO_API_URL is not a valid address. Use the full address, for example https://nitro.ng/api/v2."); }
  if (url.protocol !== "https:") return failed("NITRO_API_URL must start with https://.");
  let reading: ReturnType<typeof readNitroSyncResponse>;
  try {
    const response = await fetch(url, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ key: apiKey, action: "services" }), signal: AbortSignal.timeout(30000) });
    // Nitro lists thousands of niche variants; by default import only the services it recommends (pick: true).
    reading = readNitroSyncResponse(response.status, await response.text(), { pickedOnly: process.env["NITRO_SYNC_ALL"]?.trim() !== "true" });
  } catch { return failed("Could not reach Nitro. Check your connection and the API address, then retry."); }
  if (!reading.ok) return failed(reading.message);
  const result = await context.supabase.rpc("admin_sync_catalogue", { _services: reading.services });
  if (result.error) {
    // The browser only sees a generic line; the exact database reason goes to the server log for the admin to read.
    console.error("[nitro-sync] database rejected the import:", result.error.code, result.error.message, result.error.details ?? "");
    const guard = /less than half|Empty provider catalogue/.exec(result.error.message);
    return failed(guard ? result.error.message : "The database rejected the import.");
  }
  return { success: true, count: result.data, message: describeSyncSuccess(result.data, reading.skipped, { total: reading.total, usedPicks: reading.usedPicks }) };
});