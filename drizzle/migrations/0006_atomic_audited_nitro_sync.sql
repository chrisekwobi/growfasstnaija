CREATE FUNCTION public.admin_sync_catalogue(_services jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE n integer; existing_count integer; BEGIN
IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') OR EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND suspended) THEN RAISE EXCEPTION 'Admin access required'; END IF;
IF jsonb_typeof(_services)<>'array' OR jsonb_array_length(_services)=0 THEN RAISE EXCEPTION 'Empty provider catalogue rejected'; END IF;
SELECT count(*) INTO existing_count FROM public.services WHERE NOT provider_missing;
IF existing_count>0 AND jsonb_array_length(_services)<existing_count*0.5 THEN RAISE EXCEPTION 'Provider returned less than half the existing catalogue. Review the response before syncing.'; END IF;
n=public.upsert_nitro_services(_services);
INSERT INTO public.admin_audit_log(actor_id,actor_email,action,new_values) VALUES(auth.uid(),(SELECT email FROM public.profiles WHERE id=auth.uid()),'nitro_sync',jsonb_build_object('synced_count',n));
RETURN n; END $$;
REVOKE ALL ON FUNCTION public.admin_sync_catalogue(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_sync_catalogue(jsonb) TO authenticated;
COMMENT ON FUNCTION public.admin_sync_catalogue(jsonb) IS 'Checks real authenticated admin, guards suspiciously truncated catalogue, syncs provider metadata and audit atomically.';