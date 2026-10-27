import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAccount } from "@/components/account-controls";
import { supabase } from "@/integrations/supabase/client";
import type { CatalogueService } from "@/lib/service-catalogue";
import { formatNaira } from "@/lib/glowfast";
import { orderCost, validateCreditOrder } from "@/lib/order-validation";
import { placeOrder, type PlaceOrderResult } from "@/lib/orders.functions";

export function CreditOrderDialog({ service, onClose }: { service: CatalogueService; onClose: () => void }) {
  const { user } = useAccount();
  const [quantity, setQuantity] = useState(String(Math.max(service.min, Math.min(service.max, 1000))));
  const [link, setLink] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PlaceOrderResult | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const submitOrder = useServerFn(placeOrder);
  const profile = useQuery({ queryKey: ["profile", user?.id], enabled: Boolean(user), queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from("profiles").select("credits_balance").eq("id", user.id).single();
    if (error) throw error;
    return data;
  } });
  const total = orderCost(Number(quantity) || 0, service.pricePerThousand);
  const balance = result?.balance ?? profile.data?.credits_balance;
  const insufficient = result?.insufficient || balance !== undefined && total > balance;
  const locked = busy || result?.success || result?.pending || result?.orderId;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateCreditOrder(service, Number(quantity), link);
    if (issue) { setResult({ success: false, message: issue }); return; }
    setBusy(true); setResult(null);
    try {
      const response = await submitOrder({ data: { serviceId: service.id, requestId, quantity: Number(quantity), link: link.trim() } });
      setResult(response);
      if (response.balance !== undefined) queryClient.setQueryData(["profile", user?.id], { credits_balance: response.balance });
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    } catch { setResult({ success: false, pending: true, message: "We could not confirm the result. Contact support before placing this order again." }); }
    finally { setBusy(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="service-order-dialog"><DialogHeader><DialogTitle>Order {service.name}</DialogTitle><DialogDescription>Pay from your GROW FAST credit balance. Never share account passwords.</DialogDescription></DialogHeader>
    <form className="service-order-form" onSubmit={submit}>
      <label htmlFor="order-link">Link<input id="order-link" className="field-control" type="url" required maxLength={2048} placeholder="https://" value={link} disabled={Boolean(locked)} onChange={(event) => setLink(event.target.value)} /></label>
      <label htmlFor="order-quantity">Quantity<input id="order-quantity" className="field-control" type="number" step="1" required min={service.min} max={service.max} value={quantity} disabled={Boolean(locked)} onChange={(event) => setQuantity(event.target.value)} /></label>
      <p>{service.min.toLocaleString("en-NG")}–{service.max.toLocaleString("en-NG")} · {formatNaira(service.pricePerThousand)} per 1,000</p>
      <div className="order-estimate"><span>Order cost</span><strong>{formatNaira(total)}</strong></div>
      <div className="order-estimate"><span>Current credit balance</span><strong>{balance !== undefined ? formatNaira(balance) : profile.isError ? "Unavailable" : "Loading…"}</strong></div>
      {result && <p role={result.success ? "status" : "alert"}>{result.message}{result.orderId && <><br />Order reference: {result.orderId}</>}</p>}
      {insufficient && !result?.success && <><p>You need more credits to place this order.</p><Button type="button" onClick={() => navigate({ to: "/top-up", search: { order: service.id } })}><Wallet aria-hidden="true" />Add credits</Button></>}
      {!result?.success && !result?.pending && !result?.orderId && <Button type="submit" disabled={Boolean(busy || insufficient || balance === undefined)}>{busy ? "Placing order…" : "Place order"}</Button>}
      {(result?.success || result?.pending || result?.orderId) && <Button type="button" onClick={onClose}>Close</Button>}
    </form>
  </DialogContent></Dialog>;
}