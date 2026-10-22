export const WHATSAPP_NUMBER = "2348154776181";

export const generalWhatsAppMessage =
  "Hello Grow Fast! I would like to know more about your social media marketing services.";

export type Platform = "Instagram" | "TikTok" | "YouTube" | "Facebook" | "Engagement";
export type ServicePackage = {
  id: string;
  name: string;
  platform: Platform;
  service: string;
  description: string;
  quantity: string;
  price: number;
  delivery: string;
  requirements: string;
  featured?: boolean;
  active: boolean;
};

// Example values are deliberately marked as drafts until the owner confirms them.
export const packages: ServicePackage[] = [
  { id: "ig-starter", name: "Starter Growth", platform: "Instagram", service: "Profile engagement", description: "A small draft package for Instagram visibility.", quantity: "500 interactions", price: 5000, delivery: "Confirm timing before ordering", requirements: "Public profile may be required; confirm before payment.", active: true },
  { id: "ig-growth", name: "Growth Boost", platform: "Instagram", service: "Profile engagement", description: "A larger draft option for Instagram campaigns.", quantity: "1,500 interactions", price: 12000, delivery: "Confirm timing before ordering", requirements: "Public profile may be required; confirm before payment.", featured: true, active: true },
  { id: "ig-premium", name: "Premium Growth", platform: "Instagram", service: "Profile engagement", description: "An expanded draft option for Instagram campaigns.", quantity: "3,000 interactions", price: 22000, delivery: "Confirm timing before ordering", requirements: "Public profile may be required; confirm before payment.", active: true },
  { id: "tt-starter", name: "Starter Growth", platform: "TikTok", service: "Video views", description: "A draft video visibility package for TikTok.", quantity: "1,000 views", price: 4500, delivery: "Confirm timing before ordering", requirements: "Share the public video link; never share a password.", active: true },
  { id: "tt-growth", name: "Growth Boost", platform: "TikTok", service: "Video views", description: "A larger draft video visibility package for TikTok.", quantity: "5,000 views", price: 15000, delivery: "Confirm timing before ordering", requirements: "Share the public video link; never share a password.", featured: true, active: true },
  { id: "tt-premium", name: "Premium Growth", platform: "TikTok", service: "Video views", description: "An expanded draft video visibility package.", quantity: "10,000 views", price: 27000, delivery: "Confirm timing before ordering", requirements: "Share the public video link; never share a password.", active: true },
  { id: "yt-starter", name: "Starter Growth", platform: "YouTube", service: "Video views", description: "A draft visibility option for YouTube videos.", quantity: "1,000 views", price: 7000, delivery: "Confirm timing before ordering", requirements: "Share a public video URL; no account credentials.", active: true },
  { id: "yt-growth", name: "Growth Boost", platform: "YouTube", service: "Video views", description: "A larger draft video visibility option.", quantity: "5,000 views", price: 28000, delivery: "Confirm timing before ordering", requirements: "Share a public video URL; no account credentials.", featured: true, active: true },
  { id: "yt-premium", name: "Premium Growth", platform: "YouTube", service: "Video views", description: "An expanded draft option for YouTube visibility.", quantity: "10,000 views", price: 52000, delivery: "Confirm timing before ordering", requirements: "Share a public video URL; no account credentials.", active: true },
  { id: "fb-starter", name: "Starter Growth", platform: "Facebook", service: "Page engagement", description: "A draft visibility option for a Facebook page.", quantity: "500 interactions", price: 5000, delivery: "Confirm timing before ordering", requirements: "Share a public page URL; no account credentials.", active: true },
  { id: "fb-growth", name: "Growth Boost", platform: "Facebook", service: "Page engagement", description: "A larger draft Facebook page engagement option.", quantity: "1,500 interactions", price: 12500, delivery: "Confirm timing before ordering", requirements: "Share a public page URL; no account credentials.", featured: true, active: true },
  { id: "fb-premium", name: "Premium Growth", platform: "Facebook", service: "Page engagement", description: "An expanded draft option for Facebook pages.", quantity: "3,000 interactions", price: 23000, delivery: "Confirm timing before ordering", requirements: "Share a public page URL; no account credentials.", active: true },
  { id: "eng-starter", name: "Starter Growth", platform: "Engagement", service: "Likes and reactions", description: "A draft engagement option for public content.", quantity: "500 reactions", price: 4000, delivery: "Confirm timing before ordering", requirements: "Share a public post URL; confirm availability before payment.", active: true },
  { id: "eng-growth", name: "Growth Boost", platform: "Engagement", service: "Likes and reactions", description: "A larger draft engagement option for public content.", quantity: "1,500 reactions", price: 10000, delivery: "Confirm timing before ordering", requirements: "Share a public post URL; confirm availability before payment.", featured: true, active: true },
  { id: "eng-premium", name: "Premium Growth", platform: "Engagement", service: "Likes and reactions", description: "An expanded draft engagement option.", quantity: "3,000 reactions", price: 18000, delivery: "Confirm timing before ordering", requirements: "Share a public post URL; confirm availability before payment.", active: true },
];

export const formatNaira = (price: number) =>
  `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(price)}`;

export const packageOrderMessage = (item: ServicePackage) =>
  `Hello Grow Fast! I would like to enquire about this package.\n\nPlatform: ${item.platform}\nService: ${item.service}\nPackage: ${item.name}\nQuantity: ${item.quantity}\nPrice shown: ${formatNaira(item.price)} (draft sample; please confirm)\n\nPlease confirm availability, delivery expectations, payment instructions, and any requirements.\n\nThank you.`;

export const whatsappUrl = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

export const platformPages = [
  { name: "Instagram", slug: "instagram", path: "/services/instagram", icon: "instagram", description: "Explore draft engagement and visibility options for Instagram creators and brands.", headline: "Grow Your Instagram Presence", service: "Profile engagement" },
  { name: "TikTok", slug: "tiktok", path: "/services/tiktok", icon: "video", description: "Explore draft visibility options for short-form video creators.", headline: "Give Your TikTok Content More Visibility", service: "Video views" },
  { name: "YouTube", slug: "youtube", path: "/services/youtube", icon: "youtube", description: "Explore draft package examples for video visibility on YouTube.", headline: "Support Your YouTube Growth Goals", service: "Video views" },
  { name: "Facebook", slug: "facebook", path: "/services/facebook", icon: "users", description: "Explore draft page engagement options for businesses and communities.", headline: "Build Your Facebook Page Presence", service: "Page engagement" },
  { name: "Social Engagement", slug: "engagement", path: "/services/engagement", icon: "heart", description: "Browse draft examples for reactions and public post engagement.", headline: "Explore Likes, Comments, Views and More", service: "Likes and reactions" },
  { name: "Creator Visibility", slug: "engagement", path: "/services/engagement", icon: "sparkles", description: "Discover enquiry-first options for creator and brand campaigns.", headline: "Visibility for Your Next Campaign", service: "Creator visibility" },
];

export const faqItems = [
  { question: "How do I place an order?", answer: "Choose a package and continue to WhatsApp. Our team can confirm availability, the final price, any requirements, and delivery expectations before you proceed." },
  { question: "How do I pay?", answer: "Payment methods are not yet confirmed. Please ask the team on WhatsApp for current payment instructions before making any payment." },
  { question: "How long does delivery take?", answer: "Delivery timing depends on the selected service and must be confirmed by the team before an order is accepted." },
  { question: "Which platforms do you support?", answer: "This draft catalogue shows Instagram, TikTok, YouTube, Facebook, and general engagement examples. Please confirm which services are currently available." },
  { question: "Can I order more than one service?", answer: "You can ask about multiple services in one WhatsApp conversation. Availability and pricing should be confirmed for each package." },
  { question: "How can I contact customer support?", answer: "Contact Grow Fast on WhatsApp using the enquiry buttons on this website. Support hours have not been provided yet." },
  { question: "What is the refund or cancellation policy?", answer: "This policy is a draft and has not been confirmed. Please ask the team about cancellations or refunds before paying." },
  { question: "Do you need my password or login code?", answer: "No. Never share your account password, authentication code, or recovery information to place an enquiry." },
];