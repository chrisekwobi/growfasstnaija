import { z } from "zod";

export const serviceEditsSchema = z.object({
  id: z.string().uuid(),
  price_per_1000_ngn: z.number().finite().nonnegative(),
  markup_percent: z.number().finite().nonnegative(),
  min_qty: z.number().int().positive(),
  max_qty: z.number().int().positive(),
  active: z.boolean(),
}).refine((value) => value.max_qty >= value.min_qty, "Maximum must be at least the minimum")
  .refine((value) => !value.active || value.price_per_1000_ngn > 0, "Set a price before activating a service");

const nitroItemSchema = z.object({
  service: z.union([z.string(), z.number()]).transform(String),
  name: z.string().min(1), category: z.string().default("Other"),
  rate: z.coerce.number().finite().nonnegative(),
  min: z.coerce.number().int().positive(), max: z.coerce.number().int().positive(),
}).refine((value) => value.max >= value.min);

export function platformFromCategory(category: string) {
  const value = category.toLowerCase();
  if (value.includes("tiktok") || value.includes("tik tok")) return "TikTok";
  if (value.includes("instagram")) return "Instagram";
  if (value.includes("facebook")) return "Facebook";
  if (value.includes("youtube")) return "YouTube";
  if (value.includes("twitter") || /\bx\b/.test(value)) return "Twitter / X";
  if (value.includes("telegram")) return "Telegram";
  return "Other";
}

function toCatalogueRow(item: z.infer<typeof nitroItemSchema>) {
  const fromCategory = platformFromCategory(item.category);
  return {
    nitro_service_id: item.service, name: item.name, category: item.category,
    // Some providers keep the platform only in the service name, so fall back to it.
    platform: fromCategory === "Other" ? platformFromCategory(item.name) : fromCategory,
    // Historical column name: Nitro NG quotes rates in Naira, so this holds Naira per 1,000.
    nitro_rate_usd: item.rate, min_qty: item.min, max_qty: item.max,
  };
}

export function parseNitroServices(input: unknown) {
  return z.array(nitroItemSchema).parse(input).map(toCatalogueRow);
}

/**
 * Tolerant import: one malformed entry must not block the whole catalogue.
 * Invalid entries are counted and skipped; duplicate service ids keep the last entry,
 * because a single upsert cannot touch the same row twice.
 */
export function parseNitroCatalogue(input: unknown) {
  if (!Array.isArray(input)) throw new Error("Nitro did not return a list of services.");
  const byId = new Map<string, ReturnType<typeof toCatalogueRow>>();
  let skipped = 0;
  for (const entry of input) {
    const parsed = nitroItemSchema.safeParse(entry);
    if (!parsed.success) { skipped += 1; continue; }
    byId.set(parsed.data.service, toCatalogueRow(parsed.data));
  }
  return { services: [...byId.values()], skipped };
}