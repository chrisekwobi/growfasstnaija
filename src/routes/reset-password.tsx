import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SiteFrame, pageHead } from "@/components/glowfast-site";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Reset Your Password | GROW FAST", "Choose a new password securely using your Grow Fast password recovery email."),
  component: ResetPassword,
});

function ResetPassword() {
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const isRecovery = hash.get("type") === "recovery";
    if (isRecovery) {
      void supabase.auth.getUser().then(({ data }) => setRecovery(Boolean(data.user)));
    }
    // The generated client consumes recovery hash tokens; wait for its existing auth flow.
    const timer = window.setTimeout(() => {
      if (isRecovery) void supabase.auth.getUser().then(({ data }) => setRecovery(Boolean(data.user)));
    }, 800);
    return () => window.clearTimeout(timer);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    if (password !== String(values.get("confirm") ?? "")) { setNotice("Passwords do not match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setNotice(error.message);
    else { setDone(true); setNotice("Your password has been updated."); }
  }
  return <SiteFrame><main className="page-wrap account-page"><section className="auth-panel"><h1>Set a new password</h1>
    {recovery && !done ? <form className="service-order-form" onSubmit={submit}><label htmlFor="new-password">New password<input id="new-password" name="password" type="password" autoComplete="new-password" className="field-control" required minLength={8} /></label><label htmlFor="confirm-password">Confirm password<input id="confirm-password" name="confirm" type="password" autoComplete="new-password" className="field-control" required minLength={8} /></label><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Update password"}</Button></form> : <p>{done ? "You can now continue with your new password." : "Open the password reset link from your email. If it has expired, request a new link."}</p>}
    {notice && <p role="status">{notice}</p>}<Button asChild><Link to="/auth" search={{ mode: "login" }}>Return to login</Link></Button>
  </section></main></SiteFrame>;
}