import { formatNaira } from "@/lib/glowfast";

export type CatalogueService = {
  id: string;
  platform: string;
  type: string;
  name: string;
  pricePerThousand: number;
  min: number;
  max: number;
};

// Editable demonstration values only; replace this file with confirmed live offers.
export const cataloguePlatforms = [
  { id: "tiktok", name: "TikTok", icon: "video", types: ["Followers", "Likes", "Views", "Comments", "Shares", "Saves"], rates: [6500, 1800, 500, 9000, 2500, 2200] },
  { id: "instagram", name: "Instagram", icon: "instagram", types: ["Followers", "Likes", "Views", "Comments", "Shares", "Saves"], rates: [7000, 2000, 600, 10000, 2800, 2500] },
  { id: "facebook", name: "Facebook", icon: "facebook", types: ["Followers", "Likes", "Views", "Comments", "Shares"], rates: [6000, 1800, 700, 8500, 2500] },
  { id: "youtube", name: "YouTube", icon: "youtube", types: ["Subscribers", "Likes", "Views", "Comments", "Shares"], rates: [15000, 3500, 2000, 12000, 4000] },
  { id: "twitter", name: "Twitter / X", icon: "twitter", types: ["Followers", "Likes", "Views", "Replies", "Reposts"], rates: [8000, 2500, 600, 9500, 3500] },
  { id: "telegram", name: "Telegram", icon: "telegram", types: ["Members", "Reactions", "Post views"], rates: [5500, 2000, 500] },
] as const;

export const catalogueServices: CatalogueService[] = cataloguePlatforms.flatMap((platform) =>
  platform.types.map((type, index) => ({
    id: `${platform.id}-${type.toLowerCase().replaceAll(" ", "-")}`,
    platform: platform.name,
    type,
    name: `${platform.name} ${type.toLowerCase()}`,
    pricePerThousand: platform.rates[index] ?? 1000,
    min: 100,
    max: 100000,
  })),
);

export const sampleOrderTotal = (service: CatalogueService, quantity: number) =>
  service.pricePerThousand * quantity / 1000;

export function validateServiceOrder(service: CatalogueService, quantity: number, link: string): string | null {
  if (!Number.isInteger(quantity) || quantity < service.min || quantity > service.max) {
    return `Choose a whole-number quantity from ${service.min.toLocaleString("en-NG")} to ${service.max.toLocaleString("en-NG")}.`;
  }
  try {
    const url = new URL(link);
    if (!["https:", "http:"].includes(url.protocol)) return "Enter a public http or https link.";
  } catch {
    return "Enter a valid public profile or post link.";
  }
  return null;
}

export const serviceOrderMessage = (service: CatalogueService, quantity: number, link: string) =>
  `Hello Grow Fast! I would like to order.\n\nPlatform: ${service.platform}\nService: ${service.name}\nQuantity: ${quantity.toLocaleString("en-NG")}\nPublic link: ${link}\nSample rate per 1,000: ${formatNaira(service.pricePerThousand)}\nSample total: ${formatNaira(sampleOrderTotal(service, quantity))} (draft; please confirm)\n\nPlease confirm availability, final price, requirements, delivery and cancellation terms before I pay. Then share payment instructions in this WhatsApp chat. I will not share passwords or login codes.`;