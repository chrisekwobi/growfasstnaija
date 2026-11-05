export async function nitroAdminRequest(action: string, parameters: Record<string, string> = {}) {
  const key = process.env["NITRO_API_KEY"]?.trim();
  const raw = process.env["NITRO_API_URL"]?.trim();
  if (!key || !raw) throw new Error("Nitro is not configured yet.");
  const url = new URL(raw);
  if (url.protocol !== "https:") throw new Error("Nitro requires a secure API address.");
  let response: Response;
  try { response = await fetch(url, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ key, action, ...parameters }), signal: AbortSignal.timeout(20000) }); }
  catch { throw new Error("Nitro could not be reached. Please retry."); }
  if (!response.ok) throw new Error("Nitro did not accept this request. Check your provider account.");
  const payload: unknown = await response.json();
  if (typeof payload === "object" && payload !== null && "error" in payload) throw new Error("Nitro did not accept this request. Check your provider account.");
  return payload;
}