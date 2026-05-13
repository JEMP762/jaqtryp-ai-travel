CREATE TABLE IF NOT EXISTS public.commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  markup_type text NOT NULL DEFAULT 'percent' CHECK (markup_type IN ('percent','fixed')),
  markup_value numeric NOT NULL DEFAULT 3,
  service_fee_type text NOT NULL DEFAULT 'fixed' CHECK (service_fee_type IN ('percent','fixed')),
  service_fee_value numeric NOT NULL DEFAULT 18,
  default_currency text NOT NULL DEFAULT 'BRL',
  upsells_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_settings_read_authed"
ON public.commission_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "commission_settings_admin_write"
ON public.commission_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.commission_settings (markup_type, markup_value, service_fee_type, service_fee_value, default_currency, upsells_enabled)
SELECT 'percent', 3, 'fixed', 18, 'BRL', true
WHERE NOT EXISTS (SELECT 1 FROM public.commission_settings);

CREATE TABLE IF NOT EXISTS public.booking_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_kind text NOT NULL CHECK (order_kind IN ('flight','stay')),
  order_id text,
  original_amount numeric NOT NULL,
  markup_amount numeric NOT NULL DEFAULT 0,
  service_fee_amount numeric NOT NULL DEFAULT 0,
  final_amount numeric NOT NULL,
  currency text NOT NULL,
  net_profit numeric NOT NULL DEFAULT 0,
  upsells jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.booking_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bc_select_own_or_admin"
ON public.booking_commissions FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "bc_insert_own"
ON public.booking_commissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bc_user ON public.booking_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_bc_created ON public.booking_commissions(created_at DESC);