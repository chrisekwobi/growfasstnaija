import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pageHead, SiteFrame } from "@/components/glowfast-site";
import { useAccount } from "@/components/account-controls";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({ mode: search.mode === "signup" ? "signup" : "login" }),
  head: () => pageHead("Login or Create Your Account | GROW FAST", "Sign in to your Grow Fast account or register securely with your email and password."),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAccount();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice("");
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("If this email has an account, a password reset link will arrive shortly. Check your inbox and spam folder.");
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (data.session) await navigate({ to: "/" });
        else setNotice("Check your email to confirm your account before logging in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/" });
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to continue. Please retry.");
    } finally { setBusy(false); }
  }
  return <SiteFrame><main className="page-wrap account-page"><section className="auth-panel">
    <span className="eyebrow">Your GROW FAST account</span><h1>{forgot ? "Reset your password" : mode === "signup" ? "Create account" : "Welcome back"}</h1>
    {user && !forgot ? <><p>You are signed in.</p><Button asChild><Link to="/">Continue to services</Link></Button></> : <form onSubmit={submit} className="service-order-form">
      <label htmlFor="auth-email">Email<input id="auth-email" className="field-control" name="email" type="email" autoComplete="email" required /></label>
      {!forgot && <label htmlFor="auth-password">Password<input id="auth-password" className="field-control" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required /></label>}
      <Button type="submit" disabled={busy}>{busy ? "Please wait…" : forgot ? "Send reset link" : mode === "signup" ? "Sign up" : "Login"}</Button>
    </form>}
    {notice && <p className="auth-notice" role="status">{notice}</p>}
    <div className="auth-actions"><Button asChild><Link to="/auth" search={{ mode: mode === "signup" ? "login" : "signup" }} onClick={() => { setForgot(false); setNotice(""); }}>{mode === "signup" ? "Already registered? Login" : "New here? Sign up"}</Link></Button><Button onClick={() => { setForgot(!forgot); setNotice(""); }}>{forgot ? "Back to login" : "Forgot password?"}</Button></div>
  </section></main></SiteFrame>;
}