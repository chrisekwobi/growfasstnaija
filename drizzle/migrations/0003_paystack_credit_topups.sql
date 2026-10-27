CREATE TABLE public.credit_topups (reference text PRIMARY KEY CHECK (reference ~ '^gf_[a-f0-9]{32}$'), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, email text NOT NULL, amount_kobo bigint NOT NULL CHECK (amount_kobo >= 50000 AND amount_kobo <= 9007199254740991), currency text NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'), status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','credited')), order_service_id uuid REFERENCES public.services(id), created_at timestamptz NOT NULL DEFAULT now(), credited_at timestamptz);
GRANT SELECT ON public.credit_topups TO authenticated;
GRANT ALL ON public.credit_topups TO service_role;
ALTER TABLE public.credit_topups ENABLE ROW LEVEL SECURITY;
CREATE POLICY topups_read_own ON public.credit_topups FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX topups_owner_created ON public.credit_topups(user_id, created_at DESC);
CREATE FUNCTION public.settle_paystack_topup(_reference text, _amount_kobo bigint, _currency text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.credit_topups%ROWTYPE; b numeric; BEGIN
 SELECT * INTO t FROM public.credit_topups WHERE reference = _reference FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Unknown payment reference'; END IF;
 IF _amount_kobo IS DISTINCT FROM t.amount_kobo OR _currency IS DISTINCT FROM t.currency THEN RAISE EXCEPTION 'Payment amount or currency mismatch'; END IF;
 SELECT credits_balance INTO b FROM public.profiles WHERE id = t.user_id FOR UPDATE;
 IF t.status = 'credited' THEN RETURN jsonb_build_object('balance', b, 'already_credited', true, 'amount', t.amount_kobo / 100.0); END IF;
 INSERT INTO public.credit_transactions(user_id,type,amount,reference) VALUES(t.user_id,'topup',t.amount_kobo / 100.0,t.reference);
 UPDATE public.profiles SET credits_balance = credits_balance + t.amount_kobo / 100.0 WHERE id = t.user_id RETURNING credits_balance INTO b;
 UPDATE public.credit_topups SET status = 'credited', credited_at = now() WHERE reference = t.reference;
 RETURN jsonb_build_object('balance', b, 'already_credited', false, 'amount', t.amount_kobo / 100.0);
END $$;
REVOKE ALL ON FUNCTION public.settle_paystack_topup(text,bigint,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_paystack_topup(text,bigint,text) TO service_role;
COMMENT ON FUNCTION public.settle_paystack_topup(text,bigint,text) IS 'Only call after Paystack server verification or signed charge.success; row locking makes callback and webhook settlement exactly-once.';