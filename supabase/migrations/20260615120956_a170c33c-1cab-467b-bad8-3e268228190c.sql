
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  main_currency TEXT NOT NULL DEFAULT 'BRL',
  trip_id UUID,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_own" ON public.wallets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX wallets_user_idx ON public.wallets(user_id);
CREATE INDEX wallets_trip_idx ON public.wallets(trip_id);

CREATE TABLE public.wallet_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  amount_in_main NUMERIC NOT NULL,
  fx_rate_used NUMERIC NOT NULL DEFAULT 1,
  category TEXT NOT NULL DEFAULT 'other',
  merchant TEXT,
  country TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'manual',
  receipt_url TEXT,
  notes TEXT,
  raw_ocr JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_expenses TO authenticated;
GRANT ALL ON public.wallet_expenses TO service_role;
ALTER TABLE public.wallet_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_expenses_own" ON public.wallet_expenses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX wallet_expenses_wallet_idx ON public.wallet_expenses(wallet_id);
CREATE INDEX wallet_expenses_user_idx ON public.wallet_expenses(user_id);
CREATE INDEX wallet_expenses_trip_idx ON public.wallet_expenses(trip_id);
CREATE INDEX wallet_expenses_occurred_idx ON public.wallet_expenses(occurred_at DESC);

CREATE TABLE public.wallet_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID,
  total_budget NUMERIC NOT NULL DEFAULT 0,
  daily_budget NUMERIC NOT NULL DEFAULT 0,
  emergency_reserve NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(wallet_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_budgets TO authenticated;
GRANT ALL ON public.wallet_budgets TO service_role;
ALTER TABLE public.wallet_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_budgets_own" ON public.wallet_budgets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.wallet_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_alerts TO authenticated;
GRANT ALL ON public.wallet_alerts TO service_role;
ALTER TABLE public.wallet_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_alerts_own" ON public.wallet_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX wallet_alerts_wallet_idx ON public.wallet_alerts(wallet_id);

CREATE TRIGGER wallets_touch_updated BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER wallet_expenses_touch_updated BEFORE UPDATE ON public.wallet_expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER wallet_budgets_touch_updated BEFORE UPDATE ON public.wallet_budgets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
