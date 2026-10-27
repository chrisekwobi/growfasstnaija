import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "@/components/account-controls";
import { SiteFrame, pageHead } from "@/components/glowfast-site";
import { Button } from "@/components/ui/button";
import { verifyTopup } from "@/lib/topups.functions";
import { topupReferenceSchema } from "@/lib/topup-validation";
import { CheckCircle2, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/payment-callback")({
  validateSearch: (search: Record<string, unknown>) => ({ reference: topupReferenceSchema.safeParse(search["reference"] ?? search["trxref"]).data }),
  head: () => pageHead("Payment Confirmation | GROW FAST", "Confirm your Paystack payment and view your updated Grow Fast credit balance."),
  component: PaymentCallback,
});
function PaymentCallback() {
  const { reference } = Route.useSearch();
  const { user, loading } = useAccount();
  const verify = useServerFn(verifyTopup);
  const queryClient = useQueryClient();
  const started = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ balance: number; amount: number; order?: string | undefined } | null>(null);
  async function check() {
    if (!reference || !user) return;
    setBusy(true); setMessage("");
    try {
      const response = await verify({ data: { reference } });
      setMessage(response.message);
      if (response.success) {
        setResult({ balance: response.balance, amount: response.amount, order: response.order });
        await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Payment could not be checked. Please retry."); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    if (loading || !user || !reference || started.current === `${user.id}:${reference}`) return;
    started.current = `${user.id}:${reference}`;
    void check();
  }, [loading, user, reference]);
  return <SiteFrame><main className="page-wrap account-page"><section className="topup-panel">
    <span className="eyebrow">Paystack payment</span><h1>{result ? "Credits added" : "Confirm your payment"}</h1>
    {!reference ? <p role="alert">This payment link is incomplete. Open the confirmation link from your Paystack checkout.</p> : loading ? <p role="status">Checking your account…</p> : !user ? <><p>Sign in with the account you used to pay.</p><Button asChild><Link to="/auth" search={{ mode: "login", next: "payment-callback", reference }}>Login to confirm payment</Link></Button></> : <>
      {busy && <p role="status">Confirming your payment with Paystack…</p>}
      {message && <p role="status" className="auth-notice">{result && <CheckCircle2 className="inline mr-2" aria-hidden="true" />}{message}</p>}
      {result ? <><div className="order-estimate"><span>Top-up confirmed</span><strong>{result.amount.toLocaleString("en-NG")} credits</strong></div><div className="order-estimate"><span>Current balance</span><strong>{result.balance.toLocaleString("en-NG")} credits</strong></div><Button asChild><Link to="/" search={{ order: result.order }}>Continue to {result.order ? "your order" : "services"}</Link></Button></> : <Button onClick={() => void check()} disabled={busy}><RefreshCw aria-hidden="true" />Check payment again</Button>}
    </>}
    {!result && <><p>If you were charged, check again instead of making another payment.</p><Button asChild><Link to="/top-up">Back to add credits</Link></Button></>}
  </section></main></SiteFrame>;
}