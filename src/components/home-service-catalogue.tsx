import { useState, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Route as HomeRoute } from "@/routes/index";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAccount } from "@/components/account-controls";
import { CreditOrderDialog } from "@/components/credit-order-dialog";
import { activeServicesQuery } from "@/lib/services-query";
import { ArrowRight, Bookmark, Check, Facebook, Heart, Instagram, MessageCircle, Music2, Send, Twitter, UserRoundPlus, Wallet, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNaira, generalWhatsAppMessage, whatsappUrl } from "@/lib/glowfast";
import { cataloguePlatforms, type CatalogueService } from "@/lib/service-catalogue";

const platformIcons = { video: Music2, instagram: Instagram, facebook: Facebook, youtube: Youtube, twitter: Twitter, telegram: Send };

export function HomeServiceCatalogue() {
  const { data: rows } = useSuspenseQuery(activeServicesQuery);
  const catalogueServices: CatalogueService[] = rows.map((row) => ({ id: row.id, platform: row.platform, type: row.category, name: row.name, pricePerThousand: row.price_per_1000_ngn, min: row.min_qty, max: row.max_qty }));
  const otherPlatforms = [...new Set(catalogueServices.map((service) => service.platform))].filter((name) => !cataloguePlatforms.some((platform) => platform.name === name));
  const displayedPlatforms = [...cataloguePlatforms.map((platform) => ({ id: platform.id as string, name: platform.name as string, icon: platform.icon as string })), ...otherPlatforms.map((name, index) => ({ id: `other-${index}`, name, icon: "telegram" }))];
  const [selected, setSelected] = useState<CatalogueService | null>(null);
  const { user, loading } = useAccount();
  const navigate = useNavigate();
  const { order } = HomeRoute.useSearch();
  useEffect(() => {
    if (!order || loading) return;
    if (!user) { void navigate({ to: "/auth", search: { mode: "login", order } }); return; }
    const service = rows.find((row) => row.id === order);
    if (service) setSelected({ id: service.id, platform: service.platform, type: service.category, name: service.name, pricePerThousand: service.price_per_1000_ngn, min: service.min_qty, max: service.max_qty });
  }, [order, loading, user, rows, navigate]);
  const selectService = (service: CatalogueService) => {
    if (!user) { void navigate({ to: "/auth", search: { mode: "login", order: service.id } }); return; }
    setSelected(service);
  };
  const closeOrder = () => { setSelected(null); if (order) void navigate({ to: "/", search: {} }); };

  return <>
    <nav className="platform-jumps" aria-label="Jump to platform services">
      <div className="page-wrap jump-inner">{displayedPlatforms.map((platform) => {
        const Icon = platformIcons[platform.icon as keyof typeof platformIcons] ?? Send;
        return <Button asChild key={platform.id}><a href={`#${platform.id}`}><Icon aria-hidden="true" />{platform.name}</a></Button>;
      })}</div>
    </nav>
    <section className="page-wrap beginner-steps" id="how-it-works" aria-labelledby="how-title">
      <div className="steps-heading"><h2 id="how-title">How it works</h2><Button asChild><Link to="/top-up">Add credits</Link></Button></div>
      <ol className="beginner-step-grid">
        <li><span className="beginner-number">1</span><UserRoundPlus aria-hidden="true" /><h3>Create account</h3></li>
        <li><span className="beginner-number">2</span><Wallet aria-hidden="true" /><h3>Add credits</h3></li>
        <li><span className="beginner-number">3</span><Check aria-hidden="true" /><h3>Pick a service and paste your link</h3></li>
      </ol>
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
    {selected && user && <CreditOrderDialog key={selected.id} service={selected} onClose={closeOrder} />}
  </>;
}