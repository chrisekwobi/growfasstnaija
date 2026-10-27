import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { parseNitroServices, serviceEditsSchema } from "@/lib/nitro";

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
    const result = await context.supabase.from("services").update(edits).eq("id", id).select("id").single();
    if (result.error) throw new Error("Could not save this service.");
    return { success: true };
  });

// sync-nitro-services: app-internal Cloud function, never a browser provider call.
export const syncNitroServices = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (role.error || !role.data) throw new Error("Admin access required.");
  const apiUrl = process.env["NITRO_API_URL"];
  const apiKey = process.env["NITRO_API_KEY"];
  if (!apiUrl || !apiKey) return { success: false, count: 0, message: "Add Nitro API URL and API key in Cloud secrets before syncing." };
  try {
    const url = new URL(apiUrl);
    if (url.protocol !== "https:") throw new Error("HTTPS required");
    const response = await fetch(url, { method: "POST", redirect: "error", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ key: apiKey, action: "services" }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error("Nitro request failed");
    const services = parseNitroServices(await response.json());
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("upsert_nitro_services", { _services: services });
    if (result.error) throw new Error("Nitro import failed");
    return { success: true, count: result.data, message: `Synced ${result.data} services. Existing prices, markup and quantity limits were preserved. New services are inactive until priced.` };
  } catch {
    return { success: false, count: 0, message: "Nitro sync failed. Check the API URL, key and provider service response, then retry. Existing service edits were not changed." };
  }
});