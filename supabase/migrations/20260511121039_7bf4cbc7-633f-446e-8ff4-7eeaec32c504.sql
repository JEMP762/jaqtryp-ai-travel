
CREATE TABLE public.flight_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  duffel_order_id text NOT NULL,
  booking_reference text,
  total_amount numeric,
  total_currency text,
  passengers jsonb NOT NULL DEFAULT '[]'::jsonb,
  slices jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'confirmed',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flight_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY flight_orders_all_own ON public.flight_orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_flight_orders_user ON public.flight_orders(user_id, created_at DESC);

CREATE TRIGGER flight_orders_touch
  BEFORE UPDATE ON public.flight_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
