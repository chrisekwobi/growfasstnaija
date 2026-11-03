import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ClipboardList, LogIn, LogOut, ShieldCheck, Wallet } from "lucide-react";
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

function useAccountActions() {
  const { user } = useAccount();
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
  return { profile, isAdmin: Boolean(role.data), logout, notice };
}

/** Header account area. On phones and tablets only the balance chip (or Log in / Sign up) shows; the rest lives in the menu. */
export function AccountControls() {
  const { user, loading } = useAccount();
  const { profile, isAdmin, logout, notice } = useAccountActions();
  if (loading) return <span className="account-loading" aria-live="polite">Account…</span>;
  return <div className="account-controls">
    {user ? <>
      <Link to="/top-up" className="credit-balance" aria-label="Your credit balance. Add credits"><Wallet size={16} aria-hidden="true" />{profile.isError ? "Balance unavailable" : profile.data ? <><span>{formatNaira(profile.data.credits_balance)}</span><span className="credit-word"> credits</span></> : "Balance…"}</Link>
      <span className="account-actions">
        <Button asChild><Link to="/orders">My orders</Link></Button>
        <Button asChild><Link to="/top-up">Add credits</Link></Button>
        {isAdmin && <Button asChild><Link to="/admin">Admin</Link></Button>}
        <Button size="icon" onClick={logout} aria-label="Log out" title="Log out"><LogOut aria-hidden="true" /></Button>
      </span>
    </> : <>
      <Button asChild className="account-login"><Link to="/auth" search={{ mode: "login" }}>Log in</Link></Button>
      <Button asChild><Link to="/auth" search={{ mode: "signup" }}>Sign up</Link></Button>
    </>}
    {notice && <span role="alert">{notice}</span>}
  </div>;
}

/** Account links for the mobile menu (logged-in users only). */
export function MobileAccountMenu({ onNavigate }: { onNavigate: () => void }) {
  const { user } = useAccount();
  const { isAdmin, logout } = useAccountActions();
  if (!user) return <div className="mobile-account mobile-login-only"><Link to="/auth" search={{ mode: "login" }} onClick={onNavigate}><LogIn aria-hidden="true" />Log in</Link></div>;
  return <div className="mobile-account" role="group" aria-label="Your account">
    <Link to="/orders" onClick={onNavigate}><ClipboardList aria-hidden="true" />My orders</Link>
    <Link to="/top-up" onClick={onNavigate}><Wallet aria-hidden="true" />Add credits</Link>
    {isAdmin && <Link to="/admin" onClick={onNavigate}><ShieldCheck aria-hidden="true" />Admin</Link>}
    <button type="button" onClick={() => { onNavigate(); void logout(); }}><LogOut aria-hidden="true" />Log out</button>
  </div>;
}