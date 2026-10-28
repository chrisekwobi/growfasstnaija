import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { pageHead, SiteFrame } from "@/components/glowfast-site";
import { useAccount } from "@/components/account-controls";
import { orderReturnSchema } from "@/lib/order-validation";
import { topupReferenceSchema } from "@/lib/topup-validation";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: string; order?: string | undefined; next?: string | undefined; reference?: string | undefined } => ({ mode: search["mode"] === "signup" ? "signup" : "login", order: orderReturnSchema.parse(search["order"]), next: search["next"] === "top-up" || search["next"] === "payment-callback" ? search["next"] : undefined, reference: topupReferenceSchema.safeParse(search["reference"]).data }),
  head: () => pageHead("Login or Create Your Account | GROW FAST", "Sign in to your Grow Fast account or register securely with your email and password."),
  component: AuthPage,
});

function friendlyAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered") || lower.includes("user already exists")) return "This email already has an account. Log in instead, or use Forgot password if you need a new password.";
  if (lower.includes("password") && (lower.includes("at least") || lower.includes("weak") || lower.includes("short") || lower.includes("characters"))) return "That password is too weak. Use at least 8 characters with a mix of letters and numbers.";
  if (lower.includes("email not confirmed")) return "Your account is not confirmed yet. Open the confirmation link in your email, then log in.";
  if (lower.includes("invalid login credentials")) return "Email or password is incorrect. Check both and try again, or use Forgot password.";
  if (lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("over_email_send_rate_limit")) return "Too many attempts. Please wait a few minutes and try again.";
  if (lower.includes("invalid email") || lower.includes("unable to validate email")) return "That email address does not look valid. Check it and try again.";
  return message || "Unable to continue. Please retry.";
}

function AuthPage() {
  const { mode, order, next, reference } = Route.useSearch();
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAccount();
  async function continueAfterLogin() {
    if (next === "top-up") await navigate({ to: "/top-up", search: { order } });
    else if (next === "payment-callback" && reference) await navigate({ to: "/payment-callback", search: { reference } });
    else await navigate({ to: "/", search: { order } });
  }
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
        const returnPath = next === "top-up" ? `/top-up${order ? `?order=${encodeURIComponent(order)}` : ""}` : next === "payment-callback" && reference ? `/payment-callback?reference=${encodeURIComponent(reference)}` : `/${order ? `?order=${encodeURIComponent(order)}` : ""}`;
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}${returnPath}` } });
        if (error) throw error;
        if (data.session) await continueAfterLogin();
        else setNotice("Check your email to confirm your account before logging in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await continueAfterLogin();
      }
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally { setBusy(false); }
  }
  return <SiteFrame><main className="page-wrap account-page"><section className="auth-panel">
    <span className="eyebrow">Your GROW FAST account</span><h1>{forgot ? "Reset your password" : mode === "signup" ? "Create account" : "Welcome back"}</h1>
    {user && !forgot ? <><p>You are signed in.</p><Button onClick={() => void continueAfterLogin()}>Continue to {next ? "your top-up" : order ? "your order" : "services"}</Button></> : <form onSubmit={submit} className="service-order-form">
      <label htmlFor="auth-email">Email<input id="auth-email" className="field-control" name="email" type="email" autoComplete="email" required /></label>
      {!forgot && <label htmlFor="auth-password">Password<input id="auth-password" className="field-control" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required /></label>}
      <Button type="submit" disabled={busy}>{busy ? "Please wait…" : forgot ? "Send reset link" : mode === "signup" ? "Sign up" : "Login"}</Button>
    </form>}
    {notice && <p className="auth-notice" role="status">{notice}</p>}
    <div className="auth-actions"><Button asChild><Link to="/auth" search={{ mode: mode === "signup" ? "login" : "signup", order, next, reference }} onClick={() => { setForgot(false); setNotice(""); }}>{mode === "signup" ? "Already registered? Login" : "New here? Sign up"}</Link></Button><Button onClick={() => { setForgot(!forgot); setNotice(""); }}>{forgot ? "Back to login" : "Forgot password?"}</Button></div>
  </section></main></SiteFrame>;
}