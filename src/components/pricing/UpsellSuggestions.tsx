import { useState } from "react";
import { ShieldCheck, Luggage, Wifi, Car, Sofa, BedDouble, Check } from "lucide-react";
import { fmtMoney } from "@/lib/pricing";

export type Upsell = {
  id: string;
  title: string;
  desc: string;
  price: number;
  icon: any;
};

const FLIGHT_UPSELLS: Upsell[] = [
  { id: "insurance", title: "Seguro viagem", desc: "Cobertura médica até US$ 60k", price: 49, icon: ShieldCheck },
  { id: "bag", title: "Bagagem despachada", desc: "23kg adicional", price: 89, icon: Luggage },
  { id: "seat", title: "Assento premium", desc: "Mais espaço para as pernas", price: 65, icon: Sofa },
  { id: "esim", title: "Chip internacional", desc: "10GB válido por 30 dias", price: 35, icon: Wifi },
];

const STAY_UPSELLS: Upsell[] = [
  { id: "transfer", title: "Traslado aeroporto", desc: "Veículo executivo ida/volta", price: 120, icon: Car },
  { id: "breakfast", title: "Café da manhã", desc: "Buffet completo incluso", price: 45, icon: BedDouble },
  { id: "insurance", title: "Seguro estadia", desc: "Cancelamento + bagagem", price: 29, icon: ShieldCheck },
  { id: "esim", title: "Chip internacional", desc: "10GB válido por 30 dias", price: 35, icon: Wifi },
];

type Props = {
  kind: "flight" | "stay";
  currency: string;
  enabled?: boolean;
  onChange?: (selected: Upsell[]) => void;
};

export function UpsellSuggestions({ kind, currency, enabled = true, onChange }: Props) {
  const list = kind === "flight" ? FLIGHT_UPSELLS : STAY_UPSELLS;
  const [sel, setSel] = useState<Record<string, boolean>>({});

  if (!enabled) return null;

  function toggle(u: Upsell) {
    const next = { ...sel, [u.id]: !sel[u.id] };
    setSel(next);
    onChange?.(list.filter((x) => next[x.id]));
  }

  const selectedTotal = list.filter((x) => sel[x.id]).reduce((s, x) => s + x.price, 0);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Sugestões inteligentes</div>
        {selectedTotal > 0 && (
          <span className="text-xs text-muted-foreground">
            +{fmtMoney(selectedTotal, currency)}
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {list.map((u) => {
          const Icon = u.icon;
          const active = !!sel[u.id];
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u)}
              className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                active ? "border-primary/60 bg-primary/10" : "border-border/60 hover:border-primary/40"
              }`}
            >
              <div className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"}`}>
                {active ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{u.title}</div>
                <div className="text-xs text-muted-foreground">{u.desc}</div>
              </div>
              <div className="text-sm font-bold text-primary">+{fmtMoney(u.price, currency)}</div>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Itens opcionais. Cobrança real será habilitada em breve.
      </p>
    </div>
  );
}
