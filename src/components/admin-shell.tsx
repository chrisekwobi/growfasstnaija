import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Settings2, Layers3, ShoppingCart, Users, Receipt, ShieldCheck, PanelLeftClose, PanelLeftOpen, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkAdminAccess } from "@/lib/admin.functions";

const navigation = [
  { to: "/admin", label: "Overview", icon: BarChart3 },
  { to: "/admin/settings", label: "Pricing & settings", icon: Settings2 },
  { to: "/admin/services", label: "Services", icon: Layers3 },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/audit", label: "Audit log", icon: ShieldCheck },
] as const;

export function AdminShell() {
  const check = useServerFn(checkAdminAccess);
  const access = useQuery({ queryKey: ["admin-access"], queryFn: () => check(), retry: false });
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { if (window.matchMedia("(max-width: 700px)").matches) setCollapsed(true); }, []);
  const pathname = useRouterState({ select: state => state.location.pathname });
  if (access.isPending) return <main className="page-wrap account-page"><p role="status">Checking admin access…</p></main>;
  if (access.isError) return <main className="page-wrap account-page"><h1 className="text-2xl font-bold">Admin access required</h1><p className="my-4">This account cannot open the administration area.</p><div className="flex gap-3"><Button asChild><Link to="/">Back to services</Link></Button><Button onClick={() => access.refetch()}><RefreshCw />Retry</Button></div></main>;
  return <div className={`admin-workspace ${collapsed ? "admin-collapsed" : ""}`}>
    <aside className="admin-sidebar"><Link to="/" className="admin-brand" title="GROW FAST">GF<span>GROW FAST</span></Link><p className="admin-sidebar-label">Administration</p><nav aria-label="Administration">{navigation.map(item => <Button asChild key={item.to} className={pathname === item.to || pathname === `${item.to}/` ? "admin-nav-active" : ""}><Link to={item.to} title={item.label} aria-label={item.label}><item.icon aria-hidden="true" /><span>{item.label}</span></Link></Button>)}</nav><Button asChild className="admin-back"><Link to="/"><ArrowLeft /><span>Back to website</span></Link></Button></aside>
    <div className="admin-main"><header className="admin-topbar"><Button size="icon" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand admin sidebar" : "Collapse admin sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button><span><ShieldCheck size={17} />Admin workspace</span><Link to="/" className="text-muted-foreground">GROW FAST</Link></header><Outlet /></div>
  </div>;
}