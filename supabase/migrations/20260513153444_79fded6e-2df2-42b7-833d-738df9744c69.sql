-- Default currency to EUR
UPDATE public.commission_settings SET default_currency = 'EUR' WHERE default_currency = 'BRL';
ALTER TABLE public.commission_settings ALTER COLUMN default_currency SET DEFAULT 'EUR';

-- FX cache
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  rate numeric NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (base_currency, quote_currency)
);
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY fx_rates_read_all ON public.fx_rates FOR SELECT TO authenticated USING (true);

-- Pending bookings (bridge Stripe payment -> Duffel order)
CREATE TABLE IF NOT EXISTS public.pending_flight_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  offer_id text NOT NULL,
  passengers jsonb NOT NULL DEFAULT '[]'::jsonb,
  original_amount numeric NOT NULL,
  original_currency text NOT NULL,
  final_amount numeric NOT NULL,
  final_currency text NOT NULL,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_session_id text,
  payment_status text NOT NULL DEFAULT 'pending',
  duffel_order_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_flight_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY pfb_select_own ON public.pending_flight_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY pfb_insert_own ON public.pending_flight_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pfb_touch BEFORE UPDATE ON public.pending_flight_bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Provider tracking on commissions
ALTER TABLE public.booking_commissions ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'duffel-balance';
ALTER TABLE public.booking_commissions ADD COLUMN IF NOT EXISTS payment_session_id text;