import type { AdminData } from "@/lib/admin.functions";

export function adminReport(data: Pick<AdminData, "orders" | "profiles" | "topups" | "settings">, now = new Date()) {
  const key = (date: Date) => date.toISOString().slice(0, 10);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const week = new Date(start); week.setUTCDate(week.getUTCDate() - (week.getUTCDay() + 6) % 7);
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const payments = data.topups.filter(t => t.status === "credited");
  const revenue = payments.reduce((sum, t) => sum + t.amount_kobo / 100, 0);
  const completed = data.orders.filter(o => o.status === "completed");
  const known = completed.filter(o => o.nitro_cost_ngn !== null);
  const nitroCost = known.reduce((sum, o) => sum + Number(o.nitro_cost_ngn), 0);
  const grossProfit = known.reduce((sum, o) => sum + o.cost_credits - Number(o.nitro_cost_ngn), 0);
  const fees = revenue * data.settings.paystack_fee_percent / 100;
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start); d.setUTCDate(d.getUTCDate() - 29 + i); const date = key(d);
    const dailyRevenue = payments.filter(t => key(new Date(t.credited_at ?? t.created_at)) === date).reduce((s, t) => s + t.amount_kobo / 100, 0);
    const dailyProfit = known.filter(o => key(new Date(o.updated_at)) === date).reduce((s, o) => s + o.cost_credits - Number(o.nitro_cost_ngn), 0) - dailyRevenue * data.settings.paystack_fee_percent / 100;
    return { date, revenue: dailyRevenue, profit: dailyProfit };
  });
  return { revenue, creditsSold: revenue, liability: data.profiles.reduce((s, p) => s + p.credits_balance, 0), nitroCost, profit: grossProfit - fees, fees, unknownCosts: completed.length - known.length, today: data.orders.filter(o => new Date(o.created_at) >= start).length, week: data.orders.filter(o => new Date(o.created_at) >= week).length, month: data.orders.filter(o => new Date(o.created_at) >= month).length, days };
}