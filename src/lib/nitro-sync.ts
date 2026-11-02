import { parseNitroCatalogue } from "@/lib/nitro";

export type NitroSyncReading =
  | { ok: true; services: ReturnType<typeof parseNitroCatalogue>["services"]; skipped: number }
  | { ok: false; message: string };

const fail = (message: string): NitroSyncReading => ({ ok: false, message });

function providerMessage(body: unknown) {
  if (typeof body !== "object" || body === null || !("error" in body)) return null;
  const text = String((body as { error: unknown }).error ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  return text || "an unspecified error";
}

/** Turns Nitro's raw HTTP reply into either a clean service list or a specific, key-free explanation. */
export function readNitroSyncResponse(status: number, bodyText: string): NitroSyncReading {
  let body: unknown;
  try { body = JSON.parse(bodyText); } catch { body = undefined; }
  const reported = providerMessage(body);
  if (status === 401 || status === 403) return fail("Nitro rejected the API key. Check NITRO_API_KEY and try again.");
  if (status === 429) return fail("Nitro is rate limiting requests (60 per minute). Wait a minute and sync again.");
  if (status < 200 || status >= 300) return fail(`Nitro answered with HTTP ${status}${reported ? `: ${reported}` : ""}.`);
  if (reported) return fail(`Nitro said: ${reported}.`);
  if (!Array.isArray(body)) return fail("Nitro did not return a list of services. Check that NITRO_API_URL is the API address, for example https://nitro.ng/api/v2.");
  if (body.length === 0) return fail("Nitro returned an empty catalogue. Existing services were left unchanged.");
  const { services, skipped } = parseNitroCatalogue(body);
  if (services.length === 0) return fail(`Nitro returned ${body.length} entries but none had the expected fields (service, name, rate, min, max).`);
  return { ok: true, services, skipped };
}

export function describeSyncSuccess(count: number, skipped: number) {
  const base = `Synced ${count} services. Names, categories, markup, price overrides and quantity limits you edited were preserved. Services missing from Nitro were deactivated. New services start inactive.`;
  return skipped > 0 ? `${base} ${skipped} entries from Nitro were skipped because their data was incomplete.` : base;
}
