<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Grow Fast public-page copy, central package catalogue, and WhatsApp-order logic in reusable shared modules so prices and contact details stay consistent across routes.
- Use shared platform navigation and enquiry/payment steps on legacy public service pages; active catalogue orders use account credits and Paystack checkout funds the shared balance.
- Use semantic button colour tokens across Button variants so all website actions share the same palette without changing non-button brand accents.
- Load homepage services through a public server function and TanStack Query; authenticated credit orders use shared platform validation and server-calculated database prices, while legacy draft enquiries stay on WhatsApp.
- Use one root account provider for identity transitions and cache invalidation; Cloud's client-only authenticated layout protects admin navigation and every admin server function independently checks has_role.
- Sync Nitro metadata through an authenticated Cloud server function and admin-checked transactional SQL wrapper that atomically audits a service-role-only upsert, preserves owner overrides and flags missing provider services.
- Reserve credit orders and ledger debits atomically through service-role-only SQL functions with per-user request IDs; refund explicit provider rejections exactly once and hold ambiguous submissions for review rather than risking duplicate fulfillment.
- Initialize Paystack payments in authenticated server functions with server-owned references and stored amounts; settle signed webhooks and authenticated provider verification through one service-role-only atomic SQL function so each reference credits once. Keep provider helpers server-only through handler-local imports.
- Keep admin pages under one authenticated sidebar layout; every admin read and mutation independently checks has_role server-side, with RLS-scoped reads and transactional audited mutation RPCs to prevent browser privilege escalation.
- Derive service prices through database triggers with explicit price/markup overrides; snapshot provider costs and exchange rates when reserving orders so later syncs cannot rewrite historical profit estimates.
- Suspensions block new orders and top-ups at both server and database boundaries, but previously paid transactions can still settle to avoid losing customer funds.
