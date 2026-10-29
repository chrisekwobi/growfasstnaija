CREATE FUNCTION public.grant_owner_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF lower(NEW.email)='chris.ekwobi@gmail.com' THEN INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'admin') ON CONFLICT DO NOTHING; END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.grant_owner_admin() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER growfast_owner_admin AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();
INSERT INTO public.user_roles(user_id,role) SELECT id,'admin' FROM public.profiles WHERE lower(email)='chris.ekwobi@gmail.com' ON CONFLICT DO NOTHING;

CREATE FUNCTION public.admin_attach_nitro_order(_order_id uuid,_nitro_order_id text,_status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE actor uuid=auth.uid(); o public.orders%ROWTYPE; after_row jsonb; BEGIN
IF actor IS NULL OR NOT public.has_role(actor,'admin') OR EXISTS(SELECT 1 FROM public.profiles WHERE id=actor AND suspended) THEN RAISE EXCEPTION 'Admin access required'; END IF;
IF _status NOT IN('pending','processing','completed','partial','cancelled') OR coalesce(trim(_nitro_order_id),'')='' THEN RAISE EXCEPTION 'Invalid provider result'; END IF;
SELECT * INTO o FROM public.orders WHERE id=_order_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
IF o.status<>'submission_unknown' THEN RAISE EXCEPTION 'Only unconfirmed orders can be linked'; END IF;
IF EXISTS(SELECT 1 FROM public.orders WHERE nitro_order_id=_nitro_order_id AND id<>_order_id) THEN RAISE EXCEPTION 'That Nitro order is already linked to another order'; END IF;
UPDATE public.orders SET nitro_order_id=_nitro_order_id,provider_status=_status,status=_status WHERE id=_order_id;
SELECT to_jsonb(x) INTO after_row FROM public.orders x WHERE id=_order_id;
INSERT INTO public.admin_audit_log(actor_id,actor_email,action,entity_id,reason,old_values,new_values) VALUES(actor,(SELECT email FROM public.profiles WHERE id=actor),'nitro_attach',_order_id::text,'Confirmed with Nitro',to_jsonb(o),after_row); END $$;
REVOKE ALL ON FUNCTION public.admin_attach_nitro_order(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_attach_nitro_order(uuid,text,text) TO authenticated;