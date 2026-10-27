import { useState, type FormEvent } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { activeServicesQuery } from "@/lib/services-query";
import { ArrowRight, Bookmark, Check, Facebook, Heart, Instagram, MessageCircle, Music2, Send, Twitter, UserRoundPlus, Wallet, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNaira, generalWhatsAppMessage, whatsappUrl } from "@/lib/glowfast";
import { cataloguePlatforms, sampleOrderTotal, serviceOrderMessage, validateServiceOrder, type CatalogueService } from "@/lib/service-catalogue";

const platformIcons = { video: Music2, instagram: Instagram, facebook: Facebook, youtube: Youtube, twitter: Twitter, telegram: Send };

export function HomeServiceCatalogue() {
  const { data: rows } = useSuspenseQuery(activeServicesQuery);
  const catalogueServices: CatalogueService[] = rows.map((row) => ({ id: row.id, platform: row.platform, type: row.category, name: row.name, pricePerThousand: row.price_per_1000_ngn, min: row.min_qty, max: row.max_qty }));
  const otherPlatforms = [...new Set(catalogueServices.map((service) => service.platform))].filter((name) => !cataloguePlatforms.some((platform) => platform.name === name));
  const displayedPlatforms = [...cataloguePlatforms.map((platform) => ({ id: platform.id as string, name: platform.name as string, icon: platform.icon as string })), ...otherPlatforms.map((name, index) => ({ id: `other-${index}`, name, icon: "telegram" }))];
  const [selected, setSelected] = useState<CatalogueService | null>(null);
  const [quantity, setQuantity] = useState("1000");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const selectService = (service: CatalogueService) => { setSelected(service); setQuantity("1000"); setLink(""); setError(""); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const issue = validateServiceOrder(selected, Number(quantity), link.trim());
    if (issue) { setError(issue); return; }
    window.open(whatsappUrl(serviceOrderMessage(selected, Number(quantity), link.trim(), false)), "_blank", "noopener,noreferrer");
    setSelected(null);
  };

  return <>
    <nav className="platform-jumps" aria-label="Jump to platform services">
      <div className="page-wrap jump-inner">{displayedPlatforms.map((platform) => {
        const Icon = platformIcons[platform.icon as keyof typeof platformIcons] ?? Send;
        return <Button asChild key={platform.id}><a href={`#${platform.id}`}><Icon aria-hidden="true" />{platform.name}</a></Button>;
      })}</div>
    </nav>
    <section className="page-wrap beginner-steps" id="how-it-works" aria-labelledby="how-title">
      <div className="steps-heading"><h2 id="how-title">How it works</h2><span>Credit top-ups · coming soon</span></div>
      <ol className="beginner-step-grid">
        <li><span className="beginner-number">1</span><UserRoundPlus aria-hidden="true" /><h3>Create account</h3></li>
        <li><span className="beginner-number">2</span><Wallet aria-hidden="true" /><h3>Add credits</h3></li>
        <li><span className="beginner-number">3</span><Check aria-hidden="true" /><h3>Pick a service and paste your link</h3></li>
      </ol>
      <p>Create your account using Login / Sign up above. For now, orders and payment instructions are confirmed on WhatsApp; online credit top-ups are not enabled.</p>
    </section>
    <section className="page-wrap home-catalogue" id="services" aria-labelledby="services-title">
      <div className="catalogue-heading"><div><span className="eyebrow">Choose your platform</span><h2 id="services-title">Services</h2></div><p><Bookmark aria-hidden="true" /> Confirm availability before payment</p></div>
      {displayedPlatforms.map((platform) => {
        const Icon = platformIcons[platform.icon as keyof typeof platformIcons] ?? Send;
        const services = catalogueServices.filter((service) => service.platform === platform.name);
        return <section className={`platform-panel platform-${platform.id}`} id={platform.id} key={platform.id} aria-labelledby={`${platform.id}-title`}>
          <header className="platform-panel-heading"><div><span className="platform-emblem"><Icon size={28} aria-hidden="true" /></span><h3 id={`${platform.id}-title`}>{platform.name}</h3></div><span>{services.length} services</span></header>
          {services.length === 0 && <p className="platform-empty">No active services yet. Check back soon or chat with us.</p>}
          <div className="service-tile-grid">{services.map((service) => <article className="service-tile" key={service.id}>
            <span className="service-type">{service.type}</span>
            <h4>{service.name}</h4>
            <p className="service-rate">{formatNaira(service.pricePerThousand)} <span>per 1,000</span></p>
            <dl><div><dt>Min quantity</dt><dd>{service.min.toLocaleString("en-NG")}</dd></div><div><dt>Max quantity</dt><dd>{service.max.toLocaleString("en-NG")}</dd></div></dl>
            <Button onClick={() => selectService(service)} aria-label={`Order now: ${service.name}`}>Order now <ArrowRight aria-hidden="true" /></Button>
          </article>)}</div>
        </section>;
      })}
      <p className="catalogue-safety">Confirm availability and platform rules before payment. No guaranteed growth or earnings. Never share passwords or login codes.</p>
    </section>
    <Button asChild className="floating-support"><a href={whatsappUrl(generalWhatsAppMessage)} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />Chat with us</a></Button>
    <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent className="service-order-dialog">
        <DialogHeader><DialogTitle>Order {selected?.name}</DialogTitle><DialogDescription>Confirm your order and payment instructions on WhatsApp before paying. Credits are not deducted by this form.</DialogDescription></DialogHeader>
        {selected && <form onSubmit={submit} className="service-order-form">
          <label htmlFor="order-quantity">Quantity<input id="order-quantity" className="field-control" type="number" required min={selected.min} max={selected.max} step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
          <p>{selected.min.toLocaleString("en-NG")}–{selected.max.toLocaleString("en-NG")} · {formatNaira(selected.pricePerThousand)} per 1,000</p>
          <label htmlFor="order-link">Public profile or post link<input id="order-link" className="field-control" type="url" placeholder="https://" required value={link} onChange={(event) => setLink(event.target.value)} /></label>
          <div className="order-estimate"><span>Estimated total</span><strong>{formatNaira(sampleOrderTotal(selected, Number(quantity) || 0))}</strong></div>
          {error && <p role="alert">{error}</p>}
          <Button type="submit"><MessageCircle aria-hidden="true" />Continue to WhatsApp</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}