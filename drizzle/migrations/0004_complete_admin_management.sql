ALTER TABLE public.profiles ADD COLUMN suspended boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
UPDATE public.profiles p SET created_at=u.created_at FROM auth.users u WHERE p.id=u.id;
ALTER TABLE public.services ADD COLUMN price_override_ngn numeric CHECK(price_override_ngn>=0);
ALTER TABLE public.services ADD COLUMN markup_override boolean NOT NULL DEFAULT true;
ALTER TABLE public.services ADD COLUMN provider_missing boolean NOT NULL DEFAULT false;
ALTER TABLE public.services ADD COLUMN cost_changed boolean NOT NULL DEFAULT false;
ALTER TABLE public.services ADD COLUMN previous_nitro_rate_usd numeric;
ALTER TABLE public.services ADD COLUMN last_synced_at timestamptz;
UPDATE public.services SET price_override_ngn=price_per_1000_ngn;
ALTER TABLE public.orders ADD COLUMN nitro_cost_usd numeric;
ALTER TABLE public.orders ADD COLUMN nitro_cost_ngn numeric;
ALTER TABLE public.orders ADD COLUMN exchange_rate_snapshot numeric;
ALTER TABLE public.orders ADD COLUMN refunded_at timestamptz;
ALTER TABLE public.orders ADD COLUMN provider_status text;
ALTER TABLE public.credit_transactions DROP CONSTRAINT credit_transactions_type_check;
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check CHECK(type IN('topup','order','refund','adjustment'));
ALTER TABLE public.credit_transactions ADD COLUMN direction integer CHECK(direction IN(-1,1));
ALTER TABLE public.credit_transactions ADD COLUMN reason text;
CREATE TABLE public.admin_settings(id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), exchange_rate numeric NOT NULL DEFAULT 0 CHECK(exchange_rate>=0), default_markup numeric NOT NULL DEFAULT 0 CHECK(default_markup>=0), low_balance_threshold numeric NOT NULL DEFAULT 10 CHECK(low_balance_threshold>=0), paystack_fee_percent numeric NOT NULL DEFAULT 0 CHECK(paystack_fee_percent>=0 AND paystack_fee_percent<=100), minimum_topup numeric NOT NULL DEFAULT 500 CHECK(minimum_topup>=500), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_admin_read ON public.admin_settings FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY settings_admin_write ON public.admin_settings FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.admin_audit_log(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid, actor_email text, action text NOT NULL, entity_id text, reason text, old_values jsonb, new_values jsonb, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_admin_read ON public.admin_audit_log FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY profiles_admin_read ON public.profiles FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY orders_admin_read ON public.orders FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY transactions_admin_read ON public.credit_transactions FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE POLICY topups_admin_read ON public.credit_topups FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin'));
CREATE INDEX audit_created_idx ON public.admin_audit_log(created_at DESC);
CREATE FUNCTION public.audit_admin_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF public.has_role(auth.uid(),'admin') THEN INSERT INTO public.admin_audit_log(actor_id,actor_email,action,entity_id,old_values,new_values) VALUES(auth.uid(),(SELECT email FROM public.profiles WHERE id=auth.uid()),TG_TABLE_NAME||':'||TG_OP,NEW.id::text,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,to_jsonb(NEW)); END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.audit_admin_change() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER services_admin_audit AFTER INSERT OR UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE TRIGGER settings_admin_audit AFTER INSERT OR UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.audit_admin_change();
CREATE FUNCTION public.calculate_service_price() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE s public.admin_settings%ROWTYPE; BEGIN
SELECT * INTO s FROM public.admin_settings WHERE id=1;
IF NOT NEW.markup_override THEN NEW.markup_percent=coalesce(s.default_markup,0); END IF;
NEW.price_per_1000_ngn=coalesce(NEW.price_override_ngn,round(NEW.nitro_rate_usd*coalesce(s.exchange_rate,0)*(1+NEW.markup_percent/100),2));
IF NEW.price_per_1000_ngn<=0 OR NEW.provider_missing THEN NEW.active=false; END IF; RETURN NEW; END $$;
CREATE TRIGGER service_price_calculate BEFORE INSERT OR UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.calculate_service_price();
CREATE FUNCTION public.recalculate_service_prices() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.services SET markup_percent=CASE WHEN markup_override THEN markup_percent ELSE NEW.default_markup END WHERE price_override_ngn IS NULL; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.recalculate_service_prices() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER settings_recalculate AFTER INSERT OR UPDATE ON public.admin_settings FOR EACH ROW EXECUTE FUNCTION public.recalculate_service_prices();
CREATE FUNCTION public.capture_order_cost() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE rate numeric; cost numeric; blocked boolean; BEGIN
SELECT suspended INTO blocked FROM public.profiles WHERE id=NEW.user_id FOR UPDATE;
IF blocked THEN RAISE EXCEPTION 'Your account is suspended. Please contact support.'; END IF;
SELECT exchange_rate INTO rate FROM public.admin_settings WHERE id=1;
SELECT nitro_rate_usd INTO cost FROM public.services WHERE id=NEW.service_id;
NEW.nitro_cost_usd=NEW.quantity::numeric/1000*cost;
IF rate>0 THEN NEW.exchange_rate_snapshot=rate; NEW.nitro_cost_ngn=round(NEW.nitro_cost_usd*rate,2); END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.capture_order_cost() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER order_cost_snapshot BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.capture_order_cost();
CREATE FUNCTION public.check_topup_limits() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE minimum numeric; blocked boolean; BEGIN
SELECT suspended INTO blocked FROM public.profiles WHERE id=NEW.user_id FOR UPDATE;
IF blocked THEN RAISE EXCEPTION 'Your account is suspended. Please contact support.'; END IF;
SELECT minimum_topup INTO minimum FROM public.admin_settings WHERE id=1;
IF NEW.amount_kobo<coalesce(minimum,500)*100 THEN RAISE EXCEPTION 'Top-up is below the configured minimum'; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.check_topup_limits() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER topup_limits BEFORE INSERT ON public.credit_topups FOR EACH ROW EXECUTE FUNCTION public.check_topup_limits();
CREATE FUNCTION public.public_minimum_topup() RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT coalesce((SELECT minimum_topup FROM public.admin_settings WHERE id=1),500) $$;
REVOKE ALL ON FUNCTION public.public_minimum_topup() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_minimum_topup() TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.upsert_nitro_services(_services jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; BEGIN
UPDATE public.services SET provider_missing=true,active=false WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_services) x WHERE x->>'nitro_service_id'=services.nitro_service_id);
INSERT INTO public.services(nitro_service_id,platform,category,name,nitro_rate_usd,min_qty,max_qty,markup_override,last_synced_at)
SELECT nitro_service_id,platform,category,name,nitro_rate_usd,min_qty,max_qty,false,now() FROM jsonb_to_recordset(_services) AS x(nitro_service_id text,platform text,category text,name text,nitro_rate_usd numeric,min_qty integer,max_qty integer)
ON CONFLICT(nitro_service_id) DO UPDATE SET previous_nitro_rate_usd=services.nitro_rate_usd,cost_changed=services.nitro_rate_usd<>EXCLUDED.nitro_rate_usd,nitro_rate_usd=EXCLUDED.nitro_rate_usd,provider_missing=false,last_synced_at=now(); GET DIAGNOSTICS n=ROW_COUNT; RETURN n; END $$;
CREATE FUNCTION public.admin_manage(_action text,_payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE actor uuid=auth.uid(); before_row jsonb; after_row jsonb; uid uuid; oid uuid; amount numeric; delta numeric; balance numeric; o public.orders%ROWTYPE; reason text; BEGIN
IF actor IS NULL OR NOT public.has_role(actor,'admin') OR EXISTS(SELECT 1 FROM public.profiles WHERE id=actor AND suspended) THEN RAISE EXCEPTION 'Admin access required'; END IF;
reason=nullif(trim(_payload->>'reason'),'');
IF _action='settings' THEN
INSERT INTO public.admin_settings(id,exchange_rate,default_markup,low_balance_threshold,paystack_fee_percent,minimum_topup) VALUES(1,(_payload->>'exchange_rate')::numeric,(_payload->>'default_markup')::numeric,(_payload->>'low_balance_threshold')::numeric,(_payload->>'paystack_fee_percent')::numeric,(_payload->>'minimum_topup')::numeric) ON CONFLICT(id) DO UPDATE SET exchange_rate=EXCLUDED.exchange_rate,default_markup=EXCLUDED.default_markup,low_balance_threshold=EXCLUDED.low_balance_threshold,paystack_fee_percent=EXCLUDED.paystack_fee_percent,minimum_topup=EXCLUDED.minimum_topup,updated_at=now(); RETURN jsonb_build_object('success',true);
ELSIF _action='service' THEN
UPDATE public.services SET name=_payload->>'name',platform=_payload->>'platform',category=_payload->>'category',markup_percent=(_payload->>'markup_percent')::numeric,markup_override=(_payload->>'markup_override')::boolean,price_override_ngn=(_payload->>'price_override_ngn')::numeric,min_qty=(_payload->>'min_qty')::integer,max_qty=(_payload->>'max_qty')::integer,active=(_payload->>'active')::boolean WHERE id=(_payload->>'id')::uuid; IF NOT FOUND THEN RAISE EXCEPTION 'Service not found'; END IF; RETURN jsonb_build_object('success',true);
ELSIF _action='bulk' THEN
UPDATE public.services SET active=coalesce((_payload->>'active')::boolean,active),markup_percent=coalesce((_payload->>'markup_percent')::numeric,markup_percent),markup_override=CASE WHEN _payload ? 'markup_percent' THEN true ELSE markup_override END WHERE id IN(SELECT value::uuid FROM jsonb_array_elements_text(_payload->'ids')); RETURN jsonb_build_object('success',true);
ELSIF _action IN('adjust','suspend') THEN
IF reason IS NULL THEN RAISE EXCEPTION 'A reason is required'; END IF;
uid=(_payload->>'user_id')::uuid;
SELECT to_jsonb(p),p.credits_balance INTO before_row,balance FROM public.profiles p WHERE id=uid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
IF _action='adjust' THEN amount=(_payload->>'amount')::numeric; IF amount<=0 OR amount<>round(amount,2) THEN RAISE EXCEPTION 'Invalid adjustment amount'; END IF; delta=CASE WHEN (_payload->>'direction')::integer=-1 THEN -amount ELSE amount END; IF balance+delta<0 THEN RAISE EXCEPTION 'Insufficient balance for removal'; END IF;
UPDATE public.profiles SET credits_balance=credits_balance+delta WHERE id=uid;
INSERT INTO public.credit_transactions(user_id,type,amount,direction,reason,reference) VALUES(uid,'adjustment',amount,CASE WHEN delta<0 THEN -1 ELSE 1 END,reason,'adjustment:'||(_payload->>'request_id')) ON CONFLICT(reference) DO NOTHING;
IF NOT FOUND THEN RAISE EXCEPTION 'This adjustment was already processed'; END IF;
ELSE IF uid=actor THEN RAISE EXCEPTION 'You cannot suspend your own account'; END IF; UPDATE public.profiles SET suspended=(_payload->>'suspended')::boolean WHERE id=uid; END IF;
SELECT to_jsonb(p) INTO after_row FROM public.profiles p WHERE id=uid;
ELSIF _action IN('refund','cancel','status') THEN
oid=(_payload->>'id')::uuid; SELECT user_id INTO uid FROM public.orders WHERE id=oid;
PERFORM 1 FROM public.profiles WHERE id=uid FOR UPDATE; SELECT * INTO o FROM public.orders WHERE id=oid FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF; before_row=to_jsonb(o);
IF _action='refund' THEN
IF reason IS NULL THEN RAISE EXCEPTION 'A reason is required'; END IF;
IF EXISTS(SELECT 1 FROM public.credit_transactions WHERE reference='refund:'||oid) THEN RETURN jsonb_build_object('success',true,'message','Already refunded'); END IF;
INSERT INTO public.credit_transactions(user_id,type,amount,reason,reference) VALUES(uid,'refund',o.cost_credits,reason,'refund:'||oid);
UPDATE public.profiles SET credits_balance=credits_balance+o.cost_credits WHERE id=uid;
UPDATE public.orders SET status='refunded',refunded_at=now() WHERE id=oid;
ELSIF _action='cancel' THEN IF reason IS NULL THEN RAISE EXCEPTION 'A reason is required'; END IF; IF o.status='refunded' THEN RAISE EXCEPTION 'Refunded orders cannot be cancelled'; END IF; UPDATE public.orders SET status='cancelled' WHERE id=oid;
ELSE UPDATE public.orders SET provider_status=_payload->>'status',status=CASE WHEN status IN('refunded','cancelled') THEN status ELSE _payload->>'status' END WHERE id=oid; END IF;
SELECT to_jsonb(x) INTO after_row FROM public.orders x WHERE id=oid;
ELSE RAISE EXCEPTION 'Unknown action'; END IF;
INSERT INTO public.admin_audit_log(actor_id,actor_email,action,entity_id,reason,old_values,new_values) VALUES(actor,(SELECT email FROM public.profiles WHERE id=actor),_action,coalesce(oid,uid)::text,reason,before_row,after_row);
RETURN jsonb_build_object('success',true); END $$;
REVOKE ALL ON FUNCTION public.admin_manage(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_manage(text,jsonb) TO authenticated;
COMMENT ON COLUMN public.orders.nitro_cost_ngn IS 'Immutable order-time provider estimate; historical orders without captured costs remain NULL, never reconstructed from current rates.';