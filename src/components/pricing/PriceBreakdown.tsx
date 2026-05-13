import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, ShieldCheck, TrendingDown, CreditCard, Smartphone } from "lucide-react";
import { applyPricing, fmtMoney, valueScore, valueLabel, DEFAULT_COMMISSION_SETTINGS, type CommissionSettings } from "@/lib/pricing";
import { convert, estimateBrlChargeOnCard, fmt, IOF_RATE } from "@/lib/fx";
import { getFxRate } from "@/lib/fx.functions";

type Props = {
  originalAmount: number | string;
  currency: string;
  settings?: CommissionSettings;
  reference?: number;
  compact?: boolean;
  showInternationalEstimate?: boolean;
};

export function PriceBreakdown({ originalAmount, currency, settings, reference, compact, showInternationalEstimate = true }: Props) {
  const s = settings || DEFAULT_COMMISSION_SETTINGS;
  const b = applyPricing(originalAmount, currency, s);
  const score = valueScore(b.final, reference);
  const tag = valueLabel(score);
  const toneCls =
    tag.tone === "great"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : tag.tone === "good"
      ? "border-primary/40 bg-primary/10 text-primary"
      : tag.tone === "fair"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
      : "border-rose-500/40 bg-rose-500/10 text-rose-300";

  const fxFn = useServerFn(getFxRate);
  const needFx = showInternationalEstimate && currency.toUpperCase() !== "BRL";
  const fxQuery = useQuery({
    queryKey: ["fx", currency, "BRL"],
    queryFn: () => fxFn({ data: { base: currency.toUpperCase(), quote: "BRL" } }),
    enabled: needFx,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
  const rate = fxQuery.data?.rate || 0;
  const inBrl = rate > 0 ? convert(b.final, rate) : 0;
  const cardEstimate = rate > 0 ? estimateBrlChargeOnCard(inBrl) : null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Resumo financeiro JAQTRYP
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneCls}`}>
          {tag.label} · {score}/100
        </span>
      </div>

      <dl className={`grid gap-1.5 text-sm ${compact ? "" : "mb-2"}`}>
        <Row label="Tarifa base" value={fmtMoney(b.original, currency)} muted />
        <Row label="Taxa de suporte JAQTRYP" value={fmtMoney(b.serviceFee, currency)} muted />
        <Row label="Margem de serviço" value={fmtMoney(b.markup, currency)} muted />
        <div className="my-1 h-px bg-border/60" />
        <Row label="Total final" value={fmtMoney(b.final, currency)} bold />
        {needFx && rate > 0 && (
          <Row label="Estimativa em real" value={`≈ ${fmt(inBrl, "BRL")}`} muted />
        )}
      </dl>

      {needFx && cardEstimate && !compact && (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <div className="mb-1 font-semibold text-primary">Cobrança internacional no seu cartão BR</div>
          <div className="grid gap-0.5 text-muted-foreground">
            <div className="flex justify-between"><span>Convertido</span><span>{fmt(inBrl, "BRL")}</span></div>
            <div className="flex justify-between"><span>IOF estimado ({(IOF_RATE * 100).toFixed(1)}%)</span><span>{fmt(cardEstimate.iof, "BRL")}</span></div>
            <div className="flex justify-between"><span>Spread bancário (~4%)</span><span>{fmt(cardEstimate.spread, "BRL")}</span></div>
            <div className="mt-1 flex justify-between border-t border-border/40 pt-1 font-semibold text-foreground">
              <span>Total estimado em R$</span><span>{fmt(cardEstimate.total, "BRL")}</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Seu cartão será processado em {currency.toUpperCase()}. Valores finais variam conforme banco.
          </p>
        </div>
      )}

      {!compact && (
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Coberto por JAQ Shield · 3D Secure
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" /> Visa · Master · Amex
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-primary" /> Apple Pay · Google Pay
          </span>
          {reference && b.final < reference && (
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <TrendingDown className="h-3.5 w-3.5" /> Você economiza {fmtMoney(reference - b.final, currency)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={muted ? "text-muted-foreground" : ""}>{label}</dt>
      <dd className={bold ? "text-base font-bold text-primary" : "font-medium"}>{value}</dd>
    </div>
  );
}
