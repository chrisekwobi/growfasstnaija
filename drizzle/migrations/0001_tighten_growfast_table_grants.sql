REVOKE ALL ON public.profiles, public.user_roles, public.orders, public.credit_transactions FROM anon, authenticated;
GRANT SELECT ON public.profiles, public.user_roles, public.orders, public.credit_transactions TO authenticated;
GRANT ALL ON public.profiles, public.user_roles, public.orders, public.credit_transactions TO service_role;
REVOKE ALL ON public.services FROM anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;