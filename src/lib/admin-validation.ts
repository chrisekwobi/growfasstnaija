import { z } from "zod";

const money = z.number().finite().nonnegative();
export const settingsSchema = z.object({ exchange_rate: money.positive("Set your NGN per USD exchange rate."), default_markup: money, low_balance_threshold: money, paystack_fee_percent: money.max(100), minimum_topup: money.min(500) }).strict();
export const adminServiceSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(500), platform: z.string().trim().min(1).max(100), category: z.string().trim().min(1).max(500), markup_percent: money, markup_override: z.boolean(), price_override_ngn: money.nullable(), min_qty: z.number().int().positive(), max_qty: z.number().int().positive(), active: z.boolean() }).strict().refine(v => v.max_qty >= v.min_qty, "Maximum must be at least the minimum.");
const reason = z.string().trim().min(1, "A reason is required.").max(1000);
export const adminMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("settings"), payload: settingsSchema }),
  z.object({ action: z.literal("service"), payload: adminServiceSchema }),
  z.object({ action: z.literal("bulk"), payload: z.object({ ids: z.array(z.string().uuid()).min(1).max(1000), active: z.boolean().optional(), markup_percent: money.optional() }).strict().refine(v => v.active !== undefined || v.markup_percent !== undefined, "Choose a bulk action.") }),
  z.object({ action: z.literal("adjust"), payload: z.object({ user_id: z.string().uuid(), amount: money.positive().refine(v => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001), direction: z.union([z.literal(-1), z.literal(1)]), reason, request_id: z.string().uuid() }).strict() }),
  z.object({ action: z.literal("suspend"), payload: z.object({ user_id: z.string().uuid(), suspended: z.boolean(), reason }).strict() }),
  z.object({ action: z.enum(["refund", "cancel"]), payload: z.object({ id: z.string().uuid(), reason }).strict() }),
]);
export const defaultAdminSettings = { id: 1, exchange_rate: 0, default_markup: 0, low_balance_threshold: 10, paystack_fee_percent: 0, minimum_topup: 500 };
export function serviceEconomics(rate: number, exchange: number, markup: number, override: number | null) {
  const cost = rate * exchange;
  const price = override ?? Math.round(cost * (1 + markup / 100) * 100) / 100;
  return { cost, price, profit: price - cost, margin: price > 0 ? (price - cost) / price * 100 : 0 };
}
export function transactionDelta(row: { type: string; amount: number; direction?: number | null }) {
  return row.amount * (row.type === "order" ? -1 : row.type === "adjustment" ? row.direction ?? 1 : 1);
}
export function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`;
}