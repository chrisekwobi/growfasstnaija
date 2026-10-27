import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Wallet } from "lucide-react";
import { formatNaira } from "@/lib/glowfast";

const AccountContext = createContext<{ user: User | null; loading: boolean; recovery: boolean }>({ user: null, loading: true, recovery: false });
export const useAccount = () => useContext(AccountContext);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let mounted = true;
    const recoveryHash = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        void supabase.auth.getUser().then(({ data }) => { if (mounted) { setUser(data.user); setLoading(false); if (recoveryHash && data.user) setRecovery(true); } });
        return;
      }
      if (event === "PASSWORD_RECOVERY") { setRecovery(true); setUser(session?.user ?? null); setLoading(false); return; }
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED"].includes(event)) return;
      setUser(session?.user ?? null); setLoading(false);
      if (event === "SIGNED_OUT") { setRecovery(false); void queryClient.cancelQueries(); queryClient.clear(); }
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [queryClient, router]);
  return <AccountContext.Provider value={{ user, loading, recovery }}>{children}</AccountContext.Provider>;
}

export function AccountControls() {
  const { user, loading } = useAccount();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");
  const profile = useQuery({ queryKey: ["profile", user?.id], enabled: Boolean(user), queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from("profiles").select("credits_balance").eq("id", user.id).single();
    if (error) throw error;
    return data;
  }, refetchInterval: user ? 60000 : false });
  const role = useQuery({ queryKey: ["admin-role", user?.id], enabled: Boolean(user), queryFn: async () => {
    if (!user) return false;
    const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (error) throw error;
    return data;
  } });
  async function logout() {
    await queryClient.cancelQueries(); queryClient.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { setNotice("Could not log out. Please retry."); return; }
    await navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  }
  if (loading) return <span className="account-loading" aria-live="polite">Account…</span>;
  return <div className="account-controls">
    {user ? <><span className="credit-balance"><Wallet size={18} aria-hidden="true" />{profile.isError ? "Balance unavailable" : profile.data ? `${formatNaira(profile.data.credits_balance)} credits` : "Balance…"}</span>{role.data && <Button asChild><Link to="/admin">Admin</Link></Button>}<Button size="icon" onClick={logout} aria-label="Log out" title="Log out"><LogOut aria-hidden="true" /></Button></> : <><Button asChild><Link to="/auth" search={{ mode: "login" }}>Login</Link></Button><Button asChild><Link to="/auth" search={{ mode: "signup" }}>Sign up</Link></Button></>}
    {notice && <span role="alert">{notice}</span>}
  </div>;
}