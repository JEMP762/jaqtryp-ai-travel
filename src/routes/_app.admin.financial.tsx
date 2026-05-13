import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminFinancialSummary, checkIsAdmin } from "@/lib/commission.functions";
import { fmtMoney } from "@/lib/pricing";
import { getFxRate } from "@/lib/fx.functions";
import { convert, fmt } from "@/lib/fx";
import { TrendingUp, DollarSign, ShoppingBag, Receipt, Sparkles, Settings } from "lucide-react";

export const Route = createFileRoute("/_app/admin/financial")({
  component: AdminFinancialPage,
});

function AdminFinancialPage() {
  const checkFn = useServerFn(checkIsAdmin);
  const summaryFn = useServerFn(adminFinancialSummary);
  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkFn(), retry: false });
  const dataQ = useQuery({
    queryKey: ["admin-financial"],
    queryFn: () => summaryFn(),
    enabled: adminQ.data?.isAdmin === true,
    retry: false,
  });

  if (adminQ.isLoading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;

  if (!adminQ.data?.isAdmin) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <h1 className="text-xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva para administradores. Solicite a permissão <code className="rounded bg-muted px-1">admin</code> em <code className="rounded bg-muted px-1">user_roles</code>.
        </p>
      </div>
    );
  }

  const k = dataQ.data?.kpis;
  const series = dataQ.data?.series || [];
  const rows = dataQ.data?.rows || [];
  const max = Math.max(1, ...series.map((s: any) => s.value));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Painel financeiro</h1>
            <p className="text-sm text-muted-foreground">Receita, comissões e desempenho de reservas</p>
          </div>
        </div>
        <Link
          to="/admin/settings"
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm hover:border-primary/60"
        >
          <Settings className="h-4 w-4" /> Configurações
        </Link>
      </div>

      <EurKpis kpis={k} />
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6 mt-3">
        <Kpi icon={Receipt} label="Reservas" value={String(k?.bookings ?? 0)} />
        <Kpi icon={Receipt} label="Ticket médio" value={fmtMoney(k?.avgTicket ?? 0, "EUR")} />
        <Kpi icon={ShoppingBag} label="Upsells vendidos" value={String(k?.upsellsSold ?? 0)} />
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-3 text-sm font-semibold">Receita por dia</div>
        {series.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados ainda. Faça uma reserva para começar.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {series.map((p: any) => (
              <div key={p.date} className="group flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary"
                  style={{ height: `${(p.value / max) * 100}%`, minHeight: 4 }}
                  title={`${p.date}: ${fmtMoney(p.value, "BRL")}`}
                />
                <div className="text-[9px] text-muted-foreground">{p.date.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-3 text-sm font-semibold">Últimas reservas</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="py-2">Data</th>
                <th>Tipo</th>
                <th className="text-right">Original</th>
                <th className="text-right">Markup</th>
                <th className="text-right">Taxa</th>
                <th className="text-right">Final</th>
                <th className="text-right">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="py-2 text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="text-xs uppercase">{r.order_kind}</td>
                  <td className="text-right">{fmtMoney(Number(r.original_amount), r.currency)}</td>
                  <td className="text-right text-muted-foreground">{fmtMoney(Number(r.markup_amount), r.currency)}</td>
                  <td className="text-right text-muted-foreground">{fmtMoney(Number(r.service_fee_amount), r.currency)}</td>
                  <td className="text-right font-semibold">{fmtMoney(Number(r.final_amount), r.currency)}</td>
                  <td className="text-right font-semibold text-emerald-400">{fmtMoney(Number(r.net_profit), r.currency)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-center text-xs text-muted-foreground">Nenhuma reserva ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-primary/40 bg-gradient-card shadow-glow" : "border-border/60 bg-card"}`}>
      <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function EurKpis({ kpis }: { kpis: any }) {
  const fxFn = useServerFn(getFxRate);
  const fx = useQuery({ queryKey: ["fx", "EUR", "BRL"], queryFn: () => fxFn({ data: { base: "EUR", quote: "BRL" } }), retry: false, staleTime: 60 * 60 * 1000 });
  const rate = fx.data?.rate || 0;
  const rev = Number(kpis?.totalRevenue ?? 0);
  const com = Number(kpis?.totalCommission ?? 0);
  const np = Number(kpis?.netProfit ?? 0);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Kpi icon={DollarSign} label="Receita (€)" value={`${fmtMoney(rev, "EUR")}${rate ? ` · ≈ ${fmt(convert(rev, rate), "BRL")}` : ""}`} />
      <Kpi icon={TrendingUp} label="Comissão (€)" value={`${fmtMoney(com, "EUR")}${rate ? ` · ≈ ${fmt(convert(com, rate), "BRL")}` : ""}`} />
      <Kpi icon={Sparkles} label="Lucro líquido (€)" value={`${fmtMoney(np, "EUR")}${rate ? ` · ≈ ${fmt(convert(np, rate), "BRL")}` : ""}`} highlight />
    </div>
  );
}

