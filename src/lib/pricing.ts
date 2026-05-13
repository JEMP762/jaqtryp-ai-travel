// Pure pricing helpers — isomorphic, no server-only imports.

export type CommissionSettings = {
  markup_type: "percent" | "fixed";
  markup_value: number;
  service_fee_type: "percent" | "fixed";
  service_fee_value: number;
  default_currency: string;
  upsells_enabled: boolean;
};

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettings = {
  markup_type: "percent",
  markup_value: 3,
  service_fee_type: "fixed",
  service_fee_value: 18,
  default_currency: "BRL",
  upsells_enabled: true,
};

export type PriceBreakdownResult = {
  original: number;
  markup: number;
  serviceFee: number;
  final: number;
  currency: string;
  netProfit: number;
};

export function applyPricing(
  originalAmount: number | string,
  currency: string,
  settings: CommissionSettings = DEFAULT_COMMISSION_SETTINGS,
): PriceBreakdownResult {
  const original = Number(originalAmount) || 0;
  const markup =
    settings.markup_type === "percent"
      ? +(original * (Number(settings.markup_value) / 100)).toFixed(2)
      : Number(settings.markup_value) || 0;
  const serviceFee =
    settings.service_fee_type === "percent"
      ? +(original * (Number(settings.service_fee_value) / 100)).toFixed(2)
      : Number(settings.service_fee_value) || 0;
  const final = +(original + markup + serviceFee).toFixed(2);
  const netProfit = +(markup + serviceFee).toFixed(2);
  return { original, markup, serviceFee, final, currency, netProfit };
}

export function fmtMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Simple value score 0-100: lower price relative to a reference => higher score.
export function valueScore(final: number, reference?: number) {
  if (!reference || reference <= 0) return 78;
  const ratio = final / reference;
  if (ratio <= 0.85) return 95;
  if (ratio <= 0.95) return 88;
  if (ratio <= 1.05) return 78;
  if (ratio <= 1.2) return 65;
  return 50;
}

export function valueLabel(score: number) {
  if (score >= 90) return { label: "Excelente custo-benefício", tone: "great" as const };
  if (score >= 80) return { label: "Boa oportunidade", tone: "good" as const };
  if (score >= 65) return { label: "Preço considerado justo", tone: "fair" as const };
  return { label: "Acima da média", tone: "high" as const };
}
