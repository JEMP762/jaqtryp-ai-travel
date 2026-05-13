// Isomorphic FX helpers — no server-only imports.
export const IOF_RATE = 0.035; // ~3.5% IOF on international card spend (BR)
export const BANK_SPREAD = 0.04; // ~4% typical bank FX spread

export type FxQuote = {
  base: string;
  quote: string;
  rate: number;
  fetched_at: string;
};

export function convert(amount: number, rate: number) {
  return +(amount * rate).toFixed(2);
}

export function estimateBrlChargeOnCard(amountInQuoteCurrency: number) {
  // For an EUR charge on a Brazilian card, total reais debited ≈ converted + IOF + spread
  const iof = +(amountInQuoteCurrency * IOF_RATE).toFixed(2);
  const spread = +(amountInQuoteCurrency * BANK_SPREAD).toFixed(2);
  const total = +(amountInQuoteCurrency + iof + spread).toFixed(2);
  return { iof, spread, total };
}

export function fmt(amount: number, currency: string, locale = "pt-BR") {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
