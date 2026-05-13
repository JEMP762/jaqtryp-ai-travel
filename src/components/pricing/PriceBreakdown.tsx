import { Sparkles, ShieldCheck, TrendingDown } from "lucide-react";
import { applyPricing, fmtMoney, valueScore, valueLabel, DEFAULT_COMMISSION_SETTINGS, type CommissionSettings } from "@/lib/pricing";

type Props = {
  originalAmount: number | string;
  currency: string;
  settings?: CommissionSettings;
  reference?: number;
  compact?: boolean;
};

export function PriceBreakdown({ originalAmount, currency, settings, reference, compact }: Props) {
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
      </dl>

      {!compact && (
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Coberto por JAQ Shield
          </span>
          {reference && b.final < reference && (
            <span className="inline-flex items-center gap-1.5 text-emerald-300">
              <TrendingDown className="h-3.5 w-3.5" />
              Você economiza {fmtMoney(reference - b.final, currency)}
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
