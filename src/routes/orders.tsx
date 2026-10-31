import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wallet } from "lucide-react";
import { SiteFrame, pageHead } from "@/components/glowfast-site";
import { useAccount } from "@/components/account-controls";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/glowfast";
import { describeOrderStatus, matchesOrderFilter, orderFilters, type OrderFilter, type OrderTone } from "@/lib/order-status";

export const Route = createFileRoute("/orders")({
  head: () => pageHead("My Orders | GROW FAST", "Track every Grow Fast order you have placed, what it cost and its current status."),
  component: Orders,
});

const toneClass: Record<OrderTone, string> = {
  info: "bg-cyan/15 text-cyan",
  warning: "bg-button/15 text-button",
  success: "bg-primary/15 text-primary",
  muted: "bg-secondary text-muted-foreground",
};
const rowGrid = "md:grid-cols-[1.5fr_1.4fr_.7fr_.9fr_1.1fr]";

function Orders() {
  const { user, loading } = useAccount();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,link,quantity,cost_credits,status,created_at,services(name)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("credits_balance").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
  });
  const shown = (orders.data ?? []).filter((order) => matchesOrderFilter(order.status, filter));

  return <SiteFrame><main className="page-wrap account-page">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="eyebrow"><Wallet size={18} aria-hidden="true" /> Your account</span>
        <h1 className="mt-2 text-3xl font-extrabold">My orders</h1>
        <p className="mt-1 text-muted-foreground">Track every order you have placed and what it cost.</p>
      </div>
      {user && <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Balance <strong className="text-foreground">{profile.data ? formatNaira(profile.data.credits_balance) : "…"}</strong></span>
        <Button asChild><Link to="/top-up">Add credits</Link></Button>
      </div>}
    </div>

    {loading && <p role="status" className="mt-6">Checking your account…</p>}
    {!loading && !user && <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <p className="mb-4">Log in to see your orders.</p>
      <Button asChild><Link to="/auth" search={{ mode: "login", next: "orders" }}>Log in <ArrowRight aria-hidden="true" /></Link></Button>
    </div>}

    {user && <>
      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter orders by status">
        {orderFilters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${filter === item.id ? "border-primary bg-primary/15 text-primary" : "border-border bg-card"}`}>{item.label}</button>)}
      </div>

      {orders.isPending && <p role="status" className="mt-6">Loading your orders…</p>}
      {orders.isError && <div role="alert" className="mt-6 rounded-2xl border border-border bg-card p-6">
        <p className="mb-4">We could not load your orders. Please try again.</p>
        <Button onClick={() => orders.refetch()}>Retry</Button>
      </div>}
      {orders.isSuccess && shown.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="mb-4 text-muted-foreground">{orders.data.length === 0 ? "You have not placed any orders yet." : "No orders match this filter."}</p>
        {orders.data.length === 0 && <Button asChild><Link to="/" search={{}} hash="services">Place your first order <ArrowRight aria-hidden="true" /></Link></Button>}
      </div>}
      {orders.isSuccess && shown.length > 0 && <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className={`hidden gap-3 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid ${rowGrid}`}><span>Service</span><span>Link</span><span>Quantity</span><span>Cost</span><span>Status</span></div>
        <ul>{shown.map((order) => {
          const status = describeOrderStatus(order.status);
          const service = Array.isArray(order.services) ? order.services[0] : order.services;
          return <li key={order.id} className={`grid gap-2 border-b border-border px-5 py-4 text-sm last:border-b-0 md:items-center md:gap-3 ${rowGrid}`}>
            <div><div className="font-bold">{service?.name ?? "Service no longer listed"}</div><div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</div></div>
            <span className="break-all text-muted-foreground">{order.link}</span>
            <span><span className="text-xs text-muted-foreground md:hidden">Quantity: </span>{order.quantity.toLocaleString("en-NG")}</span>
            <span><span className="text-xs text-muted-foreground md:hidden">Cost: </span>{formatNaira(order.cost_credits)}</span>
            <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${toneClass[status.tone]}`}>{status.label}</span>
          </li>;
        })}</ul>
      </div>}
      <p className="mt-4 text-sm leading-6 text-muted-foreground">Refunds go back to your credit balance. Orders can take time to start; if one looks stuck for a long time, message us on WhatsApp with your order link.</p>
    </>}
  </main></SiteFrame>;
}
