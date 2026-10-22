import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleHelp,
  Eye,
  Facebook,
  Heart,
  Instagram,
  Menu,
  MessageCircle,
  Music2,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  X,
  Youtube,
} from "lucide-react";
import heroArt from "@/assets/glowfast-social-visual.jpg";
import { Button } from "@/components/ui/button";
import {
  faqItems,
  formatNaira,
  generalWhatsAppMessage,
  packages,
  packageOrderMessage,
  platformPages,
  type Platform,
  type ServicePackage,
  whatsappUrl,
} from "@/lib/glowfast";

const iconFor = (name: string, size = 20) => {
  const icons: Record<string, typeof Sparkles> = {
    instagram: Instagram,
    video: Music2,
    youtube: Youtube,
    facebook: Facebook,
    heart: Heart,
    sparkles: Sparkles,
    users: Users,
  };
  const Icon = icons[name] ?? Sparkles;
  return <Icon size={size} aria-hidden="true" />;
};

export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

export function Brand() {
  return (
    <Link to="/" className="brand-link" aria-label="Grow Fast home">
      <span className="brand-mark"><Sparkles size={19} aria-hidden="true" /></span>
      <span>GROW<span className="text-glow">FAST</span></span>
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Main navigation">
        <Brand />
        <div className="nav-links">
          <Link to="/">Home</Link>
          <details className="nav-services">
            <summary>Services <ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="nav-dropdown">
              <Link to="/services">All services</Link>
              {platformPages.slice(0, 5).map((platform) => (
                <Link key={platform.slug} to={platform.path}>{platform.name}</Link>
              ))}
            </div>
          </details>
          <Link to="/" hash="how-it-works">How it works</Link>
          <Link to="/about">About</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <Button asChild className="desktop-order">
          <a href={whatsappUrl(generalWhatsAppMessage)} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" /> Order on WhatsApp
          </a>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="mobile-menu-button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X /> : <Menu />}
        </Button>
      </nav>
      {menuOpen && (
        <div className="mobile-nav">
          <Link onClick={() => setMenuOpen(false)} to="/">Home</Link>
          <Link onClick={() => setMenuOpen(false)} to="/services">All services</Link>
          {platformPages.slice(0, 5).map((platform) => (
            <Link key={platform.slug} onClick={() => setMenuOpen(false)} to={platform.path}>{platform.name}</Link>
          ))}
          <Link onClick={() => setMenuOpen(false)} to="/about">About</Link>
          <Link onClick={() => setMenuOpen(false)} to="/faq">FAQ</Link>
          <Button asChild className="mt-2">
            <a href={whatsappUrl(generalWhatsAppMessage)} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden="true" /> Order on WhatsApp
            </a>
          </Button>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-wrap footer-grid">
        <div>
          <Brand />
          <p className="footer-intro">Social media marketing services made easier to explore, understand, and enquire about.</p>
        </div>
        <div className="footer-col">
          <h3>Explore</h3>
          <Link to="/services">All services</Link>
          <Link to="/about">About Grow Fast</Link>
          <Link to="/faq">Frequently asked questions</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="footer-col">
          <h3>Services</h3>
          <Link to="/services/instagram">Instagram</Link>
          <Link to="/services/tiktok">TikTok</Link>
          <Link to="/services/youtube">YouTube</Link>
          <Link to="/services/facebook">Facebook</Link>
          <Link to="/services/engagement">Engagement</Link>
        </div>
        <div className="footer-col">
          <h3>Get in touch</h3>
          <Link to="/contact">Contact page</Link>
          <a href={whatsappUrl(generalWhatsAppMessage)} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
          <Link to="/terms">Terms and conditions</Link>
          <Link to="/privacy">Privacy policy</Link>
        </div>
      </div>
      <div className="page-wrap footer-bottom">
        <span>© {new Date().getFullYear()} Grow Fast. All rights reserved.</span>
        <span>Draft package values and policies must be confirmed before ordering.</span>
      </div>
    </footer>
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  return <div className="site-shell"><SiteHeader />{children}<SiteFooter /></div>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="eyebrow"><Sparkles size={14} aria-hidden="true" />{children}</span>;
}

function SectionHeading({ eyebrow, title, copy, centered = false }: { eyebrow?: string; title: string; copy?: string; centered?: boolean }) {
  return (
    <div className={`section-heading${centered ? " centered" : ""}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="section-title">{title}</h2>
      {copy && <p className="section-copy">{copy}</p>}
    </div>
  );
}

function WhatsAppButton({ message, children, variant = "default" }: { message: string; children: ReactNode; variant?: "default" | "outline" | "secondary" }) {
  return (
    <Button asChild variant={variant}>
      <a href={whatsappUrl(message)} target="_blank" rel="noreferrer">{children}</a>
    </Button>
  );
}

export function PackageCard({ item }: { item: ServicePackage }) {
  return (
    <article className={`package-card${item.featured ? " featured" : ""}`}>
      <div className="package-card-top">
        <span className="draft-note">Editable sample</span>
        {item.featured && <span className="text-cyan text-xs font-semibold">Package example</span>}
      </div>
      <p className="package-name">{item.name}</p>
      <p className="package-meta">{item.platform} · {item.service}</p>
      <p className="package-price">{formatNaira(item.price)} <small>sample price</small></p>
      <p className="package-meta"><strong>{item.quantity}</strong><br />{item.delivery}</p>
      <div className="package-button">
        <WhatsAppButton message={packageOrderMessage(item)} variant={item.featured ? "default" : "outline"}>
          <MessageCircle aria-hidden="true" /> Ask about this package
        </WhatsAppButton>
      </div>
      <p className="package-disclaimer">Draft example only. Confirm current price, availability, requirements and delivery before payment. Never share passwords or login codes.</p>
    </article>
  );
}

function ServiceCard({ item }: { item: (typeof platformPages)[number] }) {
  return (
    <article className="service-card">
      <span className="service-icon">{iconFor(item.icon, 22)}</span>
      <h3>{item.name === "Creator Visibility" ? "Creator & Brand Visibility" : `${item.name} Growth`}</h3>
      <p>{item.description}</p>
      <Link className="service-card-link" to={item.path}>View packages <ArrowRight size={16} aria-hidden="true" /></Link>
    </article>
  );
}

function HomePackages() {
  return (
    <div className="package-grid">
      {packages.slice(0, 3).map((item) => <PackageCard key={item.id} item={item} />)}
    </div>
  );
}

function FaqList({ limit }: { limit?: number }) {
  return (
    <div className="faq-list">
      {faqItems.slice(0, limit).map((faq) => (
        <details className="faq-item" key={faq.question}>
          <summary>{faq.question}</summary>
          <div className="faq-answer">{faq.answer}</div>
        </details>
      ))}
    </div>
  );
}

function FinalCta() {
  return (
    <section className="page-wrap section" aria-labelledby="final-cta-title">
      <div className="cta-band">
        <div className="cta-content">
          <Eyebrow>Your next growth move starts here</Eyebrow>
          <h2 id="final-cta-title">Ready to grow fast and monetize your social media?</h2>
          <p>Explore the draft packages, find a service that fits, and confirm the details with our team on WhatsApp.</p>
          <div className="hero-actions">
            <Button asChild><Link to="/services">Explore packages <ArrowRight aria-hidden="true" /></Link></Button>
            <WhatsAppButton message={generalWhatsAppMessage} variant="outline"><MessageCircle aria-hidden="true" /> Chat on WhatsApp</WhatsAppButton>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const services = ["Instagram", "TikTok", "YouTube", "Facebook", "Likes", "Comments", "Views", "Followers"];
  const benefits = [
    [MessageCircle, "Easy ordering", "Choose a service and continue directly to WhatsApp."],
    [Eye, "Transparent details", "Explore sample quantities and see what needs confirmation."],
    [Share2, "Multiple platforms", "Browse services for popular social platforms in one place."],
    [Check, "Simple experience", "A straightforward path from browsing to enquiry."],
    [ShieldCheck, "Support by enquiry", "Ask the team to confirm details before you proceed."],
    [Sparkles, "Flexible examples", "Review draft options that can be adjusted when official offers are confirmed."],
  ] as const;
  const useCases = ["Music promotion and artist visibility", "Content creators and influencers", "Business pages and product awareness", "YouTube video promotion", "Short-form video creators", "Brand engagement campaigns"];
  const steps = [
    ["01", "Choose your service", "Browse platforms and explore the sample package options."],
    ["02", "Enquire through WhatsApp", "Send the selected service details to Grow Fast in one tap."],
    ["03", "Confirm and get started", "Confirm final pricing, requirements, delivery expectations, and payment with the team."],
  ];

  return (
    <main>
      <section className="page-wrap hero-section" aria-labelledby="home-title">
        <div>
          <Eyebrow>Social media services · Nigeria</Eyebrow>
          <h1 id="home-title" className="hero-title"><span className="text-glow">Grow fast</span> and monetize your social media.</h1>
          <p className="hero-copy">Explore social media marketing services for creators, businesses, and ambitious brands. Find a package example and confirm the details in just a few clicks.</p>
          <div className="hero-actions">
            <Button asChild><Link to="/services">Explore packages <ArrowRight aria-hidden="true" /></Link></Button>
            <WhatsAppButton message={generalWhatsAppMessage} variant="outline"><MessageCircle aria-hidden="true" /> Chat with us</WhatsAppButton>
          </div>
          <p className="hero-caption"><Star size={15} aria-hidden="true" /> Your next growth move starts here.</p>
        </div>
        <div className="hero-art-wrap">
          <img className="hero-art" src={heroArt} alt="Original digital illustration of a phone with an upward chart and social engagement symbols" width={1024} height={1024} fetchPriority="high" />
          <div className="art-note"><BarChart3 size={18} className="art-note-icon" aria-hidden="true" /><span>Made for your next big idea</span></div>
        </div>
      </section>
      <div className="platform-strip" aria-label="Available platform and service examples">
        {services.map((service) => <span key={service} className="platform-pill">{service}</span>)}
      </div>

      <section className="page-wrap section" aria-labelledby="services-title">
        <SectionHeading eyebrow="Explore the catalogue" title="Everything you need to grow online" copy="Browse service examples for your favourite platforms. Availability and terms should be confirmed before ordering." />
        <div className="service-grid">{platformPages.map((item) => <ServiceCard key={`${item.name}-${item.slug}`} item={item} />)}</div>
      </section>

      <section className="page-wrap section" id="packages" aria-labelledby="packages-title">
        <SectionHeading eyebrow="Package examples" title="Find your perfect growth package" copy="All prices and quantities below are editable sample values, not confirmed offers." />
        <HomePackages />
      </section>

      <section className="page-wrap section" aria-labelledby="benefits-title">
        <SectionHeading eyebrow="The Grow Fast approach" title="A simpler way to get started" copy="Explore your options, then speak directly with the team to confirm what is currently available." />
        <div className="feature-grid">
          {benefits.map(([Icon, title, copy]) => <div className="feature-item" key={title}><Icon size={21} aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></div>)}
        </div>
      </section>

      <section className="page-wrap section" id="how-it-works" aria-labelledby="steps-title">
        <SectionHeading eyebrow="Three simple steps" title="From browsing to enquiry" />
        <div className="steps-grid">{steps.map(([number, title, copy]) => <article className="step-item" key={number}><span className="step-number">STEP {number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
        <div className="hero-actions"><Button asChild variant="outline"><Link to="/services">Browse all services <ArrowRight aria-hidden="true" /></Link></Button></div>
      </section>

      <section className="page-wrap section" aria-labelledby="usecases-title">
        <SectionHeading eyebrow="Who we serve" title="A starting point for every kind of creator" copy="Marketing services may support a range of campaigns; engagement alone does not guarantee customers or organic popularity." />
        <div className="usecase-grid">{useCases.map((item, index) => <div className="usecase" key={item}>{index % 3 === 0 ? <Music2 /> : index % 3 === 1 ? <Video /> : <Users />}<span>{item}</span></div>)}</div>
      </section>

      <section className="page-wrap section" aria-labelledby="faq-preview-title">
        <SectionHeading eyebrow="Good to know" title="Frequently asked questions" />
        <FaqList limit={6} />
        <div className="hero-actions"><Button asChild variant="outline"><Link to="/faq">View all FAQs <ArrowRight aria-hidden="true" /></Link></Button></div>
      </section>
      <FinalCta />
    </main>
  );
}

export function ServicesPage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("featured");
  const shownPackages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return packages.filter((item) => item.active)
      .filter((item) => platform === "all" || item.platform === platform)
      .filter((item) => type === "all" || item.service === type)
      .filter((item) => !needle || `${item.name} ${item.platform} ${item.service} ${item.description} ${item.quantity}`.toLowerCase().includes(needle))
      .sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : a.platform.localeCompare(b.platform) || a.price - b.price);
  }, [query, platform, type, sort]);
  const reset = () => { setQuery(""); setPlatform("all"); setType("all"); setSort("featured"); };
  const serviceTypes = [...new Set(packages.map((item) => item.service))];

  return (
    <main className="page-wrap">
      <section className="page-intro">
        <Eyebrow>Grow Fast catalogue</Eyebrow>
        <h1 className="section-title">Find the right service for your next move.</h1>
        <p className="section-copy">Search and compare editable package examples. Prices and service availability are draft details that must be confirmed before ordering.</p>
        <div className="draft-note mt-5"><CircleHelp size={15} aria-hidden="true" /> Sample package catalogue · confirm all details on WhatsApp</div>
      </section>
      <section className="section pt-4" aria-label="Filter service packages">
        <div className="catalog-controls">
          <label className="relative"><span className="sr-only">Search packages</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input className="field-control pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search packages or services" /></label>
          <label><span className="sr-only">Filter by platform</span><select className="field-control" value={platform} onChange={(event) => setPlatform(event.target.value)}><option value="all">All platforms</option>{["Instagram", "TikTok", "YouTube", "Facebook", "Engagement"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span className="sr-only">Filter by service type</span><select className="field-control" value={type} onChange={(event) => setType(event.target.value)}><option value="all">All service types</option>{serviceTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span className="sr-only">Sort by price</span><select className="field-control" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Sort: catalogue</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
          <Button variant="outline" onClick={reset}><X size={16} aria-hidden="true" /> Reset</Button>
        </div>
        {shownPackages.length ? <div className="package-grid">{shownPackages.map((item) => <PackageCard item={item} key={item.id} />)}</div> : <div className="empty-state"><Search className="mx-auto mb-3" aria-hidden="true" /><p>No packages match those filters.</p><Button className="mt-4" variant="outline" onClick={reset}>Reset filters</Button></div>}
        <p className="package-disclaimer">{shownPackages.length} draft package examples shown. Final offers, fulfilment, platform compliance, and payment terms must be confirmed with Grow Fast.</p>
      </section>
      <FinalCta />
    </main>
  );
}

export function PlatformPage({ slug }: { slug: string }) {
  const item = platformPages.find((entry) => entry.slug === slug && entry.name !== "Creator Visibility");
  if (!item) return <main className="page-wrap page-intro"><h1 className="section-title">Service not found</h1><Button asChild><Link to="/services">Browse services</Link></Button></main>;
  const list = packages.filter((entry) => entry.active && entry.platform === (item.name === "Social Engagement" ? "Engagement" : item.name as Platform));
  return (
    <main className="page-wrap">
      <section className="service-hero">
        <div>
          <Eyebrow>{item.name} · package examples</Eyebrow>
          <h1 className="section-title">{item.headline}</h1>
          <p className="section-copy">{item.description} Package values below are draft samples. Ask the Grow Fast team to confirm current availability, policy, and delivery before ordering.</p>
          <div className="hero-actions"><WhatsAppButton message={generalWhatsAppMessage}><MessageCircle aria-hidden="true" /> Ask about {item.name}</WhatsAppButton><Button asChild variant="outline"><Link to="/services">See all services <ArrowRight aria-hidden="true" /></Link></Button></div>
        </div>
        <img className="service-hero-art" src={heroArt} alt={`Original digital illustration representing ${item.name} social media services`} width={1024} height={1024} loading="lazy" />
      </section>
      <section className="section pt-7">
        <SectionHeading eyebrow="Available examples" title={`${item.name} package options`} copy="Select a sample package to send its specific details to WhatsApp. Confirm all details with the team first." />
        <div className="package-grid">{list.map((entry) => <PackageCard item={entry} key={entry.id} />)}</div>
      </section>
      <section className="section pt-2">
        <SectionHeading eyebrow="Before you order" title="Keep your account secure" />
        <div className="prose-block"><p>Only share public profile, page, or content links where relevant. Never send a password, one-time login code, or recovery details. Delivery timing and service requirements vary and must be confirmed directly before payment.</p><p>Social platforms can change their rules. Review each platform's terms and any advertising policies before purchasing engagement-related services. No package guarantees virality, organic growth, or business results.</p></div>
      </section>
      <FinalCta />
    </main>
  );
}

export function AboutPage() {
  return (
    <main className="page-wrap">
      <section className="service-hero">
        <div><Eyebrow>About Grow Fast</Eyebrow><h1 className="section-title">Helping creators and brands show up online.</h1><p className="section-copy">Grow Fast is built around one simple idea: social media services should be easier to discover, understand, and enquire about.</p><div className="hero-actions"><Button asChild><Link to="/services">Explore services <ArrowRight aria-hidden="true" /></Link></Button></div></div>
        <img className="service-hero-art" src={heroArt} alt="Original Grow Fast digital illustration for social media marketing" width={1024} height={1024} loading="lazy" />
      </section>
      <section className="section pt-6"><SectionHeading eyebrow="Our approach" title="Built around clarity and conversation" /><div className="feature-grid"><div className="feature-item"><Sparkles aria-hidden="true" /><h3>Make options clear</h3><p>Present service examples with visible quantities and prices, then confirm the real offer directly.</p></div><div className="feature-item"><ShieldCheck aria-hidden="true" /><h3>Keep trust at the centre</h3><p>No made-up stories, performance claims, or promises of guaranteed growth.</p></div><div className="feature-item"><MessageCircle aria-hidden="true" /><h3>Keep enquiries simple</h3><p>Move from a package to a WhatsApp conversation with its details ready to review.</p></div></div></section>
      <FinalCta />
    </main>
  );
}

export function FaqPage() {
  return <main className="page-wrap"><section className="page-intro"><Eyebrow>Help and information</Eyebrow><h1 className="section-title">Frequently asked questions</h1><p className="section-copy">Answers below are cautious draft guidance. Please confirm business-specific details with Grow Fast before ordering.</p></section><section className="section pt-4"><FaqList /></section><FinalCta /></main>;
}

export function ContactPage() {
  const [notice, setNotice] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const message = `Hello Grow Fast! I would like to make an enquiry.\n\nName: ${String(data.get("name") ?? "")}\nPreferred contact: ${String(data.get("contact") ?? "")}\nMessage: ${String(data.get("message") ?? "")}`;
    setNotice("Your enquiry is ready in WhatsApp. Review and send it there to contact Grow Fast.");
    window.open(whatsappUrl(message), "_blank", "noopener,noreferrer");
  };
  return (
    <main className="page-wrap">
      <section className="page-intro"><Eyebrow>Let's talk</Eyebrow><h1 className="section-title">Get in touch with Grow Fast.</h1><p className="section-copy">Ask about package availability, pricing, requirements, and delivery. No payment or sensitive account information is collected here.</p></section>
      <section className="section pt-4 contact-layout">
        <div><SectionHeading title="Chat with us" copy="WhatsApp is the primary enquiry channel. Official details are shared by Grow Fast in this conversation." /><WhatsAppButton message={generalWhatsAppMessage}><MessageCircle aria-hidden="true" /> Continue on WhatsApp</WhatsAppButton><p className="package-disclaimer">Business email, social media profiles, and support hours have not been supplied.</p></div>
        <form className="contact-form" onSubmit={submit}>
          <label>Your name<input className="field-control" name="name" autoComplete="name" required maxLength={100} /></label>
          <label>Email or preferred contact method<input className="field-control" name="contact" autoComplete="email" required maxLength={150} /></label>
          <label>Your message<textarea className="field-control" name="message" required maxLength={1200} /></label>
          <p className="form-note" aria-live="polite">{notice || "This form prepares a WhatsApp message; it does not send anything until you review and send it."}</p>
          <Button type="submit"><MessageCircle aria-hidden="true" /> Continue to WhatsApp</Button>
        </form>
      </section>
    </main>
  );
}

export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const terms = kind === "terms";
  return (
    <main className="page-wrap">
      <section className="page-intro"><Eyebrow>Grow Fast · draft for review</Eyebrow><h1 className="section-title">{terms ? "Terms and conditions" : "Privacy policy"}</h1><p className="section-copy">This editable draft needs review and approval by the business owner before publication.</p></section>
      <section className="section pt-4"><div className="draft-page">Draft policy: details below are general placeholders, not legal advice. Add the business's confirmed policy and have it reviewed before launch.</div>
        {terms ? <div className="prose-block mt-8"><h2>Services and enquiries</h2><p>Package names, quantities, and prices shown on this website are editable sample values and are not confirmed offers. Contact Grow Fast to confirm service availability, scope, payment instructions, delivery expectations, and any requirements before placing an order or making payment.</p><h2>Platform requirements</h2><p>Customers should review relevant social platform terms and applicable advertising rules. Do not share passwords, authentication codes, or account recovery information. No specific outcomes, virality, sales, or organic growth are guaranteed.</p><h2>Changes and cancellations</h2><p>Refund, cancellation, replacement, and dispute terms have not yet been supplied. Ask Grow Fast about the applicable policy before payment. The owner should replace this draft with confirmed terms.</p><h2>Contact</h2><p>For questions about this draft, contact Grow Fast through the WhatsApp link on the Contact page.</p></div> : <div className="prose-block mt-8"><h2>Information you choose to share</h2><p>This website's enquiry form opens WhatsApp with the details you enter. It does not submit the form to a Grow Fast server. Review the message before sending it. WhatsApp will process information under its own terms and privacy policy.</p><h2>Information to keep private</h2><p>Do not share passwords, one-time authentication codes, or recovery information. The website does not request payment card details or account credentials.</p><h2>Cookies and analytics</h2><p>Cookie and analytics practices have not been supplied. The owner should add accurate details here if tracking, advertising, or analytics tools are enabled.</p><h2>Privacy requests</h2><p>Contact details for privacy requests and any applicable data-retention practices must be confirmed by the business owner before publication.</p></div>}
      </section>
    </main>
  );
}