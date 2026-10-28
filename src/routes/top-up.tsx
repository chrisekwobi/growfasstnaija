import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFrame, pageHead } from "@/components/glowfast-site";
import { Button } from "@/components/ui/button";
import { orderReturnSchema } from "@/lib/order-validation";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@/components/account-controls";
import { supabase } from "@/integrations/supabase/client";
import { initializeTopup } from "@/lib/topups.functions";
import { topupPresets, topupAmountSchema } from "@/lib/topup-validation";
import { formatNaira } from "@/lib/glowfast";
import { ArrowRight, ShieldCheck, Wallet } from "lucide-react";

export const Route = createFileRoute("/top-up")({
  validateSearch: (search: Record<string, unknown>): { order?: string | undefined } => ({ order: orderReturnSchema.parse(search["order"]) }),
  head: () => pageHead("Add Credits with Paystack | GROW FAST", "Top up your shared Grow Fast balance securely with Paystack. One credit equals one Naira."),
  component: TopUp,
});
function TopUp() {
  const { order } = Route.useSearch();
  const { user, loading } = useAccount();
  const [preset, setPreset] = useState<number | null>(5000);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const init = useServerFn(initializeTopup);
  const minimumQuery = useQuery({ queryKey: ["minimum-topup"], queryFn: async () => { const result = await supabase.rpc("public_minimum_topup"); if (result.error) throw result.error; return Number(result.data); } });
  const minimum = minimumQuery.data ?? 500;
  const profile = useQuery({ queryKey: ["profile", user?.id], enabled: Boolean(user), queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from("profiles").select("credits_balance").eq("id", user.id).single();
    if (error) throw error;
    return data;
  } });
  const amount = preset ?? Number(custom);
  const valid = topupAmountSchema.refine(value => value >= minimum, `The minimum top-up is ${formatNaira(minimum)}.`).safeParse(amount);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid.success) { setNotice(valid.error.issues[0]?.message ?? "Enter a valid amount."); return; }
    if (!user || busy) return;
    setBusy(true); setNotice("");
    try { const result = await init({ data: { amount, order } }); window.location.assign(result.authorizationUrl); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Could not open checkout. Please retry."); setBusy(false); }
  }
  return <SiteFrame><main className="page-wrap account-page"><section className="topup-panel">
    <span className="eyebrow"><Wallet size={18} aria-hidden="true" /> Your shared balance</span>
    <h1>Add credits</h1><p className="text-muted-foreground">TikTok, Instagram, Facebook, YouTube and every other platform. <strong className="text-foreground">1 credit = ₦1.</strong></p>
    {user && <div className="order-estimate"><span>Current balance</span><strong>{profile.isError ? "Unavailable" : profile.data ? `${Number(profile.data.credits_balance).toLocaleString("en-NG")} credits` : "Loading…"}</strong></div>}
    <form onSubmit={submit} className="service-order-form">
      <fieldset disabled={busy} className="topup-amounts"><legend>Choose an amount</legend><div className="topup-presets">{topupPresets.map((value) => <Button key={value} type="button" aria-pressed={preset === value} className={preset === value ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""} onClick={() => { setPreset(value); setCustom(""); setNotice(""); }}>{formatNaira(value)}</Button>)}</div></fieldset>
      <label htmlFor="topup-custom">Or enter a custom amount (₦)<input id="topup-custom" className="field-control" type="number" inputMode="decimal" min={minimum} step="0.01" placeholder={`Minimum ${formatNaira(minimum)}`} disabled={busy} value={custom} onChange={(event) => { setCustom(event.target.value); setPreset(null); setNotice(""); }} /></label>
      <div className="order-estimate"><span>Credits to add</span><strong>{valid.success ? amount.toLocaleString("en-NG", { maximumFractionDigits: 2 }) : "—"}</strong></div>
      {loading ? <p role="status">Checking your account…</p> : user ? <Button type="submit" disabled={busy || !valid.success}>{busy ? "Opening Paystack…" : `Pay ${valid.success ? formatNaira(amount) : "with Paystack"}`}<ArrowRight aria-hidden="true" /></Button> : <Button asChild><Link to="/auth" search={{ mode: "login", next: "top-up", order }}>Login to add credits <ArrowRight aria-hidden="true" /></Link></Button>}
      {notice && <p className="auth-notice" role="alert">{notice}</p>}
    </form>
    <p className="topup-security"><ShieldCheck size={18} aria-hidden="true" />Payment handled by Paystack. Credits are added after payment confirmation.</p>
    <Button asChild variant="outline"><Link to="/" search={{ order }}>Back to {order ? "your order" : "services"}</Link></Button>
  </section></main></SiteFrame>;
}