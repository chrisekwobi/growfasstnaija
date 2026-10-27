CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, email text NOT NULL DEFAULT '', credits_balance numeric(18,2) NOT NULL DEFAULT 0 CHECK (credits_balance >= 0));
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

CREATE TABLE public.user_roles (user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role public.app_role NOT NULL, PRIMARY KEY (user_id, role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_read_own ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE TABLE public.services (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nitro_service_id text UNIQUE NOT NULL, platform text NOT NULL DEFAULT 'Other', category text NOT NULL DEFAULT 'Other', name text NOT NULL, nitro_rate_usd numeric(18,6) NOT NULL DEFAULT 0 CHECK (nitro_rate_usd >= 0), markup_percent numeric(10,2) NOT NULL DEFAULT 0 CHECK (markup_percent >= 0), price_per_1000_ngn numeric(18,2) NOT NULL DEFAULT 0 CHECK (price_per_1000_ngn >= 0), min_qty integer NOT NULL DEFAULT 100 CHECK (min_qty > 0), max_qty integer NOT NULL DEFAULT 100000 CHECK (max_qty >= min_qty), active boolean NOT NULL DEFAULT false);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_public_active ON public.services FOR SELECT TO anon, authenticated USING (active);
CREATE POLICY services_admin_read ON public.services FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY services_admin_insert ON public.services FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY services_admin_update ON public.services FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY services_admin_delete ON public.services FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, service_id uuid NOT NULL REFERENCES public.services(id), link text NOT NULL, quantity integer NOT NULL CHECK (quantity > 0), cost_credits numeric(18,2) NOT NULL CHECK (cost_credits >= 0), nitro_order_id text, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_read_own ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX orders_owner_created ON public.orders(user_id, created_at DESC);
CREATE FUNCTION public.set_order_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_updated_at();

CREATE TABLE public.credit_transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, type text NOT NULL CHECK (type IN ('topup','order','refund')), amount numeric(18,2) NOT NULL CHECK (amount > 0), reference text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY transactions_read_own ON public.credit_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX transactions_owner_created ON public.credit_transactions(user_id, created_at DESC);

CREATE FUNCTION public.create_growfast_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles(id, email) VALUES (NEW.id, coalesce(NEW.email, '')) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.create_growfast_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER growfast_profile_created AFTER INSERT OR UPDATE OF email ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_growfast_profile();
INSERT INTO public.profiles(id,email) SELECT id, coalesce(email, '') FROM auth.users ON CONFLICT(id) DO NOTHING;

CREATE FUNCTION public.upsert_nitro_services(_services jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE count_rows integer; BEGIN
INSERT INTO public.services(nitro_service_id, platform, category, name, nitro_rate_usd, min_qty, max_qty)
SELECT nitro_service_id, platform, category, name, nitro_rate_usd, min_qty, max_qty FROM jsonb_to_recordset(_services) AS x(nitro_service_id text, platform text, category text, name text, nitro_rate_usd numeric, min_qty integer, max_qty integer)
ON CONFLICT(nitro_service_id) DO UPDATE SET platform=EXCLUDED.platform, category=EXCLUDED.category, name=EXCLUDED.name, nitro_rate_usd=EXCLUDED.nitro_rate_usd;
GET DIAGNOSTICS count_rows = ROW_COUNT; RETURN count_rows; END $$;
REVOKE ALL ON FUNCTION public.upsert_nitro_services(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_nitro_services(jsonb) TO service_role;
COMMENT ON FUNCTION public.upsert_nitro_services(jsonb) IS 'Provider metadata only on conflict: preserve owner markup, Naira price, active state and quantity limits. New imports start inactive and unpriced.';