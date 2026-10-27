ALTER TABLE public.orders ADD COLUMN request_id uuid;
CREATE UNIQUE INDEX orders_user_request_unique ON public.orders(user_id, request_id) WHERE request_id IS NOT NULL;
CREATE FUNCTION public.reserve_credit_order(_user_id uuid, _service_id uuid, _link text, _quantity integer, _request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE profile_row public.profiles%ROWTYPE; service_row public.services%ROWTYPE; order_row public.orders%ROWTYPE; cost numeric(18,2);
BEGIN
SELECT * INTO profile_row FROM public.profiles WHERE id=_user_id FOR UPDATE;
IF NOT FOUND THEN RETURN jsonb_build_object('error','Your account could not be found. Please sign in again.'); END IF;
SELECT * INTO order_row FROM public.orders WHERE user_id=_user_id AND request_id=_request_id;
IF FOUND THEN
IF order_row.service_id <> _service_id OR order_row.link <> _link OR order_row.quantity <> _quantity THEN RETURN jsonb_build_object('error','This order request has already been used. Close the form and retry.'); END IF;
RETURN jsonb_build_object('order_id',order_row.id,'balance',profile_row.credits_balance,'status',order_row.status,'existing',true,'cost',order_row.cost_credits,'nitro_order_id',order_row.nitro_order_id); END IF;
SELECT * INTO service_row FROM public.services WHERE id=_service_id FOR SHARE;
IF NOT FOUND OR NOT service_row.active OR service_row.price_per_1000_ngn <= 0 THEN RETURN jsonb_build_object('error','This service is not available right now.'); END IF;
IF _quantity < service_row.min_qty OR _quantity > service_row.max_qty THEN RETURN jsonb_build_object('error','The quantity limits changed. Refresh the service and try again.'); END IF;
cost=round(_quantity::numeric / 1000 * service_row.price_per_1000_ngn,2);
IF cost <= 0 THEN RETURN jsonb_build_object('error','This order value is too small. Choose a larger quantity.'); END IF;
IF profile_row.credits_balance < cost THEN RETURN jsonb_build_object('error','You do not have enough credits for this order.','insufficient',true,'balance',profile_row.credits_balance,'cost',cost); END IF;
UPDATE public.profiles SET credits_balance=credits_balance-cost WHERE id=_user_id;
INSERT INTO public.orders(user_id,service_id,link,quantity,cost_credits,request_id,status) VALUES(_user_id,_service_id,_link,_quantity,cost,_request_id,'submitting') RETURNING * INTO order_row;
INSERT INTO public.credit_transactions(user_id,type,amount,reference) VALUES(_user_id,'order',cost,'order:'||order_row.id);
RETURN jsonb_build_object('order_id',order_row.id,'balance',profile_row.credits_balance-cost,'status','submitting','existing',false,'cost',cost,'nitro_service_id',service_row.nitro_service_id,'platform',service_row.platform);
END $$;
REVOKE ALL ON FUNCTION public.reserve_credit_order(uuid,uuid,text,integer,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_credit_order(uuid,uuid,text,integer,uuid) TO service_role;

CREATE FUNCTION public.refund_credit_order(_user_id uuid,_order_id uuid) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE order_row public.orders%ROWTYPE; balance numeric;
BEGIN
SELECT credits_balance INTO balance FROM public.profiles WHERE id=_user_id FOR UPDATE;
SELECT * INTO order_row FROM public.orders WHERE id=_order_id AND user_id=_user_id FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
IF order_row.status='refunded' THEN RETURN balance; END IF;
IF order_row.status NOT IN ('submitting','submission_unknown') OR order_row.nitro_order_id IS NOT NULL THEN RAISE EXCEPTION 'Order cannot be refunded automatically'; END IF;
INSERT INTO public.credit_transactions(user_id,type,amount,reference) VALUES(_user_id,'refund',order_row.cost_credits,'refund:'||order_row.id);
UPDATE public.profiles SET credits_balance=credits_balance+order_row.cost_credits WHERE id=_user_id RETURNING credits_balance INTO balance;
UPDATE public.orders SET status='refunded' WHERE id=_order_id;
RETURN balance;
END $$;
REVOKE ALL ON FUNCTION public.refund_credit_order(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credit_order(uuid,uuid) TO service_role;
COMMENT ON FUNCTION public.reserve_credit_order(uuid,uuid,text,integer,uuid) IS 'Service-role only, authenticated server wrapper validates platform URL. Locks profile to prevent overspending and deduplicates by user request ID.';
COMMENT ON FUNCTION public.refund_credit_order(uuid,uuid) IS 'Service-role only. Atomic, exactly-once refund for explicitly rejected provider orders.';