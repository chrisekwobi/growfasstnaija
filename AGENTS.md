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
- Use shared platform navigation and enquiry/payment steps on public service pages so each platform keeps its context and all orders use one consistent WhatsApp handoff; payment execution remains outside the website.
- Use semantic button colour tokens across Button variants so all website actions share the same palette without changing non-button brand accents.
- Load homepage services through a public server function and TanStack Query; authenticated credit orders use shared platform validation and server-calculated database prices, while legacy draft enquiries stay on WhatsApp.
- Use one root account provider for identity transitions and cache invalidation; Cloud's client-only authenticated layout protects admin navigation and every admin server function independently checks has_role.
- Sync Nitro metadata through an authenticated Cloud server function and a service-role-only transactional SQL upsert that preserves all owner-controlled pricing and activation fields.
- Reserve credit orders and ledger debits atomically through service-role-only SQL functions with per-user request IDs; refund explicit provider rejections exactly once and hold ambiguous submissions for review rather than risking duplicate fulfillment.
