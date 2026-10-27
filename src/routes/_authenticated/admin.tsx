import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { SiteFrame, pageHead } from "@/components/glowfast-site";
import { getAdminServices, syncNitroServices, updateAdminService } from "@/lib/services.functions";
import { serviceEditsSchema } from "@/lib/nitro";
import { RefreshCw, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => pageHead("Service Administration | GROW FAST", "Manage Grow Fast service prices, markup, quantity limits and Nitro imports securely."),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return { isAdmin: false };
    const role = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
    return { isAdmin: !role.error && role.data === true };
  },
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin } = Route.useRouteContext();
  if (!isAdmin) return <SiteFrame><main className="page-wrap account-page"><h1>Admin access required</h1><p>This account cannot manage services.</p><Button asChild><Link to="/">Back to services</Link></Button></main></SiteFrame>;
  return <AdminServices />;
}

function AdminServices() {
  const getServices = useServerFn(getAdminServices);
  const sync = useServerFn(syncNitroServices);
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const services = useQuery({ queryKey: ["admin-services"], queryFn: () => getServices() });
  const synchronize = useMutation({ mutationFn: () => sync(), onSuccess: async (result) => { setNotice(result.message); await queryClient.invalidateQueries({ queryKey: ["admin-services"] }); await queryClient.invalidateQueries({ queryKey: ["active-services"] }); }, onError: () => setNotice("Could not sync services. Please retry.") });
  return <SiteFrame><main className="page-wrap admin-page"><div className="admin-heading"><div><span className="eyebrow">GROW FAST · administration</span><h1>Services</h1></div><Button onClick={() => synchronize.mutate()} disabled={synchronize.isPending}><RefreshCw aria-hidden="true" />{synchronize.isPending ? "Syncing…" : "Sync Nitro services"}</Button></div>
    <p>New imports start inactive with no Naira price. Sync preserves your price, markup, quantity limits and active settings. Markup is stored separately; changing it does not overwrite your Naira price.</p>
    {notice && <p role="status" className="auth-notice">{notice}</p>}
    <label className="admin-search" htmlFor="admin-search">Search services<input className="field-control" id="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Platform, category or service name" /></label>
    {services.isPending ? <p>Loading services…</p> : services.isError ? <p role="alert">Could not load services. <Button onClick={() => services.refetch()}>Retry</Button></p> : <div className="admin-table-scroll"><table className="admin-table"><caption>{services.data.length} services · edit and save each row</caption><thead><tr><th>Service</th><th>Price / 1,000 (₦)</th><th>Markup %</th><th>Min</th><th>Max</th><th>Active</th><th>Save</th></tr></thead><tbody>{services.data.filter((service) => `${service.name} ${service.platform} ${service.category}`.toLowerCase().includes(search.toLowerCase())).map((service) => <ServiceRow key={service.id} service={service} />)}</tbody></table>{services.data.length === 0 && <p className="empty-state">No services imported yet. Add your Nitro secrets, then sync services.</p>}</div>}
  </main></SiteFrame>;
}

function ServiceRow({ service }: { service: Database["public"]["Tables"]["services"]["Row"] }) {
  const [edits, setEdits] = useState({ price_per_1000_ngn: String(service.price_per_1000_ngn), markup_percent: String(service.markup_percent), min_qty: String(service.min_qty), max_qty: String(service.max_qty), active: service.active });
  const [notice, setNotice] = useState("");
  const update = useServerFn(updateAdminService);
  const queryClient = useQueryClient();
  const save = useMutation({ mutationFn: (data: ReturnType<typeof serviceEditsSchema.parse>) => update({ data }), onSuccess: async () => { setNotice("Saved"); await queryClient.invalidateQueries({ queryKey: ["active-services"] }); }, onError: () => setNotice("Could not save") });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = serviceEditsSchema.safeParse({ id: service.id, price_per_1000_ngn: Number(edits.price_per_1000_ngn), markup_percent: Number(edits.markup_percent), min_qty: Number(edits.min_qty), max_qty: Number(edits.max_qty), active: edits.active });
    if (!result.success) { setNotice(result.error.issues[0]?.message ?? "Check values"); return; }
    save.mutate(result.data);
  }
  return <tr><td><strong>{service.name}</strong><span>{service.platform} · {service.category}</span><small>Nitro #{service.nitro_service_id} · ${service.nitro_rate_usd}/1,000</small></td>{(["price_per_1000_ngn", "markup_percent", "min_qty", "max_qty"] as const).map((field) => <td key={field}><input form={`save-${service.id}`} aria-label={`${service.name} ${field}`} className="field-control" type="number" min={field.endsWith("qty") ? 1 : 0} step={field.endsWith("qty") ? 1 : "0.01"} required value={edits[field]} onChange={(event) => setEdits({ ...edits, [field]: event.target.value })} /></td>)}<td><input form={`save-${service.id}`} aria-label={`${service.name} active`} type="checkbox" checked={edits.active} onChange={(event) => setEdits({ ...edits, active: event.target.checked })} /></td><td><form id={`save-${service.id}`} onSubmit={submit}><Button type="submit" size="icon" title="Save service" aria-label={`Save ${service.name}`} disabled={save.isPending}><Save aria-hidden="true" /></Button><span role="status">{notice}</span></form></td></tr>;
}