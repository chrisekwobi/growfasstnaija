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

const INT32_MAX = 2147483647;

/** Provider text can hold control characters and broken emoji (lone surrogates) that make the whole upload invalid JSON. */
export function cleanText(value: string, max: number) {
  const strip = (text: string) => text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, "")
    .replace(/\s+/g, " ").trim();
  return strip(strip(value).slice(0, max));
}

const nitroItemSchema = z.object({
  service: z.union([z.string(), z.number()]).transform(String),
  name: z.string().transform((value) => cleanText(value, 500)).pipe(z.string().min(1)),
  category: z.string().default("Other").transform((value) => cleanText(value, 100)),
  rate: z.coerce.number().finite().nonnegative(),
  // The database stores quantities as 32-bit integers, so larger provider values must be skipped, not sent.
  min: z.coerce.number().int().positive().max(INT32_MAX), max: z.coerce.number().int().positive().max(INT32_MAX),
  // Nitro flags its curated, tiered catalogue (Budget / Standard / Premium) with pick: true.
  pick: z.preprocess((value) => value === true || value === "true" || value === 1, z.boolean()),
}).refine((value) => value.max >= value.min);

const platformLabels: Record<string, string> = {
  tiktok: "TikTok", instagram: "Instagram", facebook: "Facebook", youtube: "YouTube", twitter: "Twitter / X", telegram: "Telegram",
  whatsapp: "WhatsApp", linkedin: "LinkedIn", snapchat: "Snapchat", threads: "Threads", reddit: "Reddit", spotify: "Spotify",
  applemusic: "Apple Music", soundcloud: "SoundCloud", audiomack: "Audiomack", boomplay: "Boomplay", deezer: "Deezer", twitch: "Twitch",
  kick: "Kick", discord: "Discord", bluesky: "Bluesky", pinterest: "Pinterest", trustpilot: "Trustpilot", google: "Google",
  webtraffic: "Web Traffic", quora: "Quora", shazam: "Shazam", tumblr: "Tumblr", kwai: "Kwai",
};

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

/** Nitro's category is just the platform slug, so the platform comes from it and the service kind from the name. */
export function platformFromProvider(category: string, name: string) {
  const known = platformLabels[category.toLowerCase().replace(/[^a-z]/g, "")];
  if (known) return known;
  const detected = platformFromCategory(category);
  if (detected !== "Other") return detected;
  const fromName = platformFromCategory(name);
  if (fromName !== "Other") return fromName;
  return category && category !== "Other" ? category.charAt(0).toUpperCase() + category.slice(1) : "Other";
}

const serviceKinds: [RegExp, string][] = [
  [/\bfollowers?\b/i, "Followers"], [/\bsubscribers?\b/i, "Subscribers"], [/\bwatch ?time\b/i, "Watch time"],
  [/\blikes?\b/i, "Likes"], [/\bviews?\b|\bvideo plays?\b/i, "Views"], [/\bcomments?\b/i, "Comments"],
  [/\bshares?\b|\breposts?\b|\bretweets?\b/i, "Shares"], [/\bsaves?\b/i, "Saves"], [/\bmembers?\b/i, "Members"],
  [/\bplays?\b|\bstreams?\b|\blisteners?\b/i, "Plays"], [/\breactions?\b|\bvotes?\b|\bpoll\b/i, "Reactions"],
  [/\bimpressions?\b|\breach\b/i, "Reach"], [/\bvisitors?\b|\btraffic\b/i, "Traffic"], [/\breviews?\b|\bratings?\b/i, "Reviews"],
  [/\bdownloads?\b|\binstalls?\b/i, "Downloads"], [/\bmessages?\b|\bdms?\b/i, "Messages"],
];

export function serviceKindFromName(name: string) {
  return serviceKinds.find(([pattern]) => pattern.test(name))?.[1] ?? "Other";
}

function toCatalogueRow(item: z.infer<typeof nitroItemSchema>) {
  return {
    nitro_service_id: item.service, name: item.name,
    // Shown to customers as the service type (Followers, Likes, Views...).
    category: serviceKindFromName(item.name),
    platform: platformFromProvider(item.category, item.name),
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
 * because a single upsert cannot touch the same row twice. With pickedOnly, only
 * Nitro's recommended (pick: true) services are kept, when it marks any.
 */
export function parseNitroCatalogue(input: unknown, options: { pickedOnly?: boolean } = {}) {
  if (!Array.isArray(input)) throw new Error("Nitro did not return a list of services.");
  const byId = new Map<string, { row: ReturnType<typeof toCatalogueRow>; pick: boolean }>();
  let skipped = 0;
  for (const entry of input) {
    const parsed = nitroItemSchema.safeParse(entry);
    if (!parsed.success) { skipped += 1; continue; }
    byId.set(parsed.data.service, { row: toCatalogueRow(parsed.data), pick: parsed.data.pick });
  }
  const all = [...byId.values()];
  const picked = all.filter((entry) => entry.pick);
  const usePicks = Boolean(options.pickedOnly) && picked.length > 0;
  return { services: (usePicks ? picked : all).map((entry) => entry.row), skipped, total: all.length, usedPicks: usePicks };
}
