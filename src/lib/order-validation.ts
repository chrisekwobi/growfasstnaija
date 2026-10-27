import { z } from "zod";

export const orderInputSchema = z.object({ serviceId: z.string().uuid(), requestId: z.string().uuid(), quantity: z.number().int().positive().max(2147483647), link: z.string().trim().min(1).max(2048) });
export const orderCost = (quantity: number, rate: number) => Math.round(quantity * rate / 1000 * 100) / 100;
export const orderReturnSchema = z.string().uuid().optional().catch(undefined);

export function platformLinkError(platform: string, link: string): string | null {
  const message = `Paste the full link to your ${platform} video, post or profile.`;
  try {
    const url = new URL(link);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port || link.length > 2048) return message;
    const host = url.hostname.toLowerCase();
    const path = url.pathname;
    const on = (domain: string) => host === domain || host === `www.${domain}`;
    let valid = false;
    switch (platform.toLowerCase()) {
      case "tiktok": valid = (on("tiktok.com") && /^\/@[\w.-]+(?:\/video\/\d+)?\/?$/.test(path)) || (["vm.tiktok.com", "vt.tiktok.com"].includes(host) && /^\/[\w-]+\/?$/.test(path)); break;
      case "instagram": valid = on("instagram.com") && (/^\/(p|reel|reels|tv)\/[\w-]+\/?$/.test(path) || /^\/[\w.]+\/?$/.test(path) && !/^\/(accounts|explore|direct|about)\/?$/.test(path)); break;
      case "facebook": valid = (on("facebook.com") || host === "m.facebook.com" || host === "mbasic.facebook.com") && (/^\/watch\/?$/.test(path) ? /^\d+$/.test(url.searchParams.get("v") ?? "") : /^\/(profile\.php|permalink\.php|photo\.php)$/.test(path) ? /^\d+$/.test(url.searchParams.get("id") ?? url.searchParams.get("story_fbid") ?? "") : /^\/[\w.-]+(?:\/(posts|videos|photos)\/[\w.-]+)?\/?$/.test(path) || /^\/share\/[\w/.-]+\/?$/.test(path)); break;
      case "youtube": valid = on("youtu.be") ? /^\/[\w-]{11}\/?$/.test(path) : (on("youtube.com") || host === "m.youtube.com") && (path === "/watch" ? /^[\w-]{11}$/.test(url.searchParams.get("v") ?? "") : /^\/(shorts|embed)\/[\w-]{11}\/?$/.test(path) || /^\/(channel|c|user)\/[\w.-]+\/?$/.test(path) || /^\/@[\w.-]+\/?$/.test(path)); break;
      case "twitter / x": case "twitter": case "x": valid = (on("x.com") || on("twitter.com")) && /^\/[\w]+(?:\/status\/\d+)?\/?$/.test(path); break;
      case "telegram": valid = (on("t.me") || on("telegram.me")) && /^\/[\w]+(?:\/\d+)?\/?$/.test(path); break;
      default: return "Ordering for this platform is not available yet. Please contact support.";
    }
    return valid ? null : message;
  } catch { return message; }
}

export function validateCreditOrder(service: { platform: string; min: number; max: number }, quantity: number, link: string) {
  if (!Number.isInteger(quantity) || quantity < service.min || quantity > service.max) return `Choose a whole-number quantity between ${service.min.toLocaleString("en-NG")} and ${service.max.toLocaleString("en-NG")}.`;
  return platformLinkError(service.platform, link.trim());
}