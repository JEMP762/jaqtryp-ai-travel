CREATE TABLE public.stay_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  duffel_booking_id TEXT NOT NULL,
  reference TEXT,
  accommodation_name TEXT,
  check_in_date DATE,
  check_out_date DATE,
  guests INTEGER,
  rooms INTEGER,
  total_amount NUMERIC,
  total_currency TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stay_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stay_orders_all_own" ON public.stay_orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER stay_orders_touch_updated_at
  BEFORE UPDATE ON public.stay_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();