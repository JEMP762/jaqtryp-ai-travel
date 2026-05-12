import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  Plane,
  BedDouble,
  BellRing,
  Bell,
  Flame,
  TrendingDown,
  Globe,
  MapPin,
  Filter,
  Sparkles,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Duffel API is configured (DUFFEL_API_KEY) — flights & stays use internal booking
const HAS_FLIGHT_API = true;
const HAS_STAY_API = true;

// Stable future dates derived from the deal id so the search prefill is realistic
function dealDates(deal: Deal) {
  const seed = [...deal.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const offsetDays = 21 + (seed % 60); // depart 21–80 days ahead
  const tripLen = deal.nights ?? 7;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + tripLen);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { depart: iso(start), ret: iso(end) };
}

function externalBookingUrl(deal: Deal): string {
  const { depart, ret } = dealDates(deal);
  if (deal.type === "flight") {
    const o = (deal.origin || "").toLowerCase();
    const d = (deal.destination || "").toLowerCase();
    // Skyscanner deep-link (YYMMDD) — no Google interstitial
    const ymd = (iso: string) => iso.slice(2).replace(/-/g, "");
    return `https://www.skyscanner.com.br/transport/flights/${o}/${d}/${ymd(depart)}/${ymd(ret)}/`;
  }
  const q = `${deal.hotel || ""} ${deal.destination} ${deal.country}`.trim();
  return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(q)}&checkin=${depart}&checkout=${ret}`;
}

export const Route = createFileRoute("/_app/deals")({
  head: () => ({
    meta: [
      { title: "JAQ Deals — Alertas de Voos e Hotéis em Promoção" },
      {
        name: "description",
        content:
          "Dashboard de promoções de voos e hospedagens nacionais e internacionais com alertas em tempo real.",
      },
    ],
  }),
  component: DealsDashboard,
});

type DealType = "flight" | "stay";
type Scope = "national" | "international";

type Deal = {
  id: string;
  type: DealType;
  scope: Scope;
  title: string;
  origin?: string;
  destination: string;
  country: string;
  price: number;
  oldPrice: number;
  currency: string;
  discount: number; // %
  airline?: string;
  hotel?: string;
  nights?: number;
  stars?: number;
  date: string;
  hot?: boolean;
  expiresInH: number;
};

const SEED: Deal[] = [
  {
    id: "f1",
    type: "flight",
    scope: "national",
    title: "GRU → SSA ida e volta",
    origin: "GRU",
    destination: "SSA",
    country: "Brasil",
    price: 389,
    oldPrice: 920,
    currency: "BRL",
    discount: 58,
    airline: "GOL",
    date: "Jul 12 – Jul 19",
    hot: true,
    expiresInH: 6,
  },
  {
    id: "f2",
    type: "flight",
    scope: "international",
    title: "GRU → LIS ida e volta",
    origin: "GRU",
    destination: "LIS",
    country: "Portugal",
    price: 2890,
    oldPrice: 5400,
    currency: "BRL",
    discount: 47,
    airline: "TAP",
    date: "Set 03 – Set 17",
    hot: true,
    expiresInH: 12,
  },
  {
    id: "f3",
    type: "flight",
    scope: "international",
    title: "GIG → MIA ida e volta",
    origin: "GIG",
    destination: "MIA",
    country: "EUA",
    price: 2199,
    oldPrice: 3800,
    currency: "BRL",
    discount: 42,
    airline: "LATAM",
    date: "Ago 10 – Ago 22",
    expiresInH: 24,
  },
  {
    id: "f4",
    type: "flight",
    scope: "national",
    title: "BSB → REC ida e volta",
    origin: "BSB",
    destination: "REC",
    country: "Brasil",
    price: 459,
    oldPrice: 780,
    currency: "BRL",
    discount: 41,
    airline: "Azul",
    date: "Jun 20 – Jun 27",
    expiresInH: 18,
  },
  {
    id: "f5",
    type: "flight",
    scope: "international",
    title: "GRU → BUE ida e volta",
    origin: "GRU",
    destination: "BUE",
    country: "Argentina",
    price: 1190,
    oldPrice: 1980,
    currency: "BRL",
    discount: 40,
    airline: "Aerolíneas",
    date: "Jul 05 – Jul 12",
    expiresInH: 36,
  },
  {
    id: "s1",
    type: "stay",
    scope: "national",
    title: "Resort all-inclusive em Porto de Galinhas",
    destination: "Porto de Galinhas",
    country: "Brasil",
    price: 690,
    oldPrice: 1450,
    currency: "BRL",
    discount: 52,
    hotel: "Tabaobi Smart Hotel",
    nights: 3,
    stars: 4,
    date: "Jul 18 – Jul 21",
    hot: true,
    expiresInH: 9,
  },
  {
    id: "s2",
    type: "stay",
    scope: "international",
    title: "Hotel boutique em Lisboa",
    destination: "Lisboa",
    country: "Portugal",
    price: 1890,
    oldPrice: 3200,
    currency: "BRL",
    discount: 41,
    hotel: "Lisbon Charm Suites",
    nights: 4,
    stars: 4,
    date: "Set 05 – Set 09",
    expiresInH: 14,
  },
  {
    id: "s3",
    type: "stay",
    scope: "international",
    title: "Resort em Cancún com café da manhã",
    destination: "Cancún",
    country: "México",
    price: 3290,
    oldPrice: 5600,
    currency: "BRL",
    discount: 41,
    hotel: "Grand Oasis",
    nights: 5,
    stars: 5,
    date: "Ago 12 – Ago 17",
    hot: true,
    expiresInH: 20,
  },
  {
    id: "s4",
    type: "stay",
    scope: "national",
    title: "Pousada na Chapada Diamantina",
    destination: "Lençóis",
    country: "Brasil",
    price: 540,
    oldPrice: 920,
    currency: "BRL",
    discount: 41,
    hotel: "Vila Serrano",
    nights: 3,
    stars: 4,
    date: "Jun 14 – Jun 17",
    expiresInH: 30,
  },
  {
    id: "s5",
    type: "stay",
    scope: "international",
    title: "Hotel design em Buenos Aires",
    destination: "Buenos Aires",
    country: "Argentina",
    price: 980,
    oldPrice: 1620,
    currency: "BRL",
    discount: 39,
    hotel: "Palermo Soho Loft",
    nights: 3,
    stars: 4,
    date: "Jul 08 – Jul 11",
    expiresInH: 40,
  },
];

const fmt = (v: number, c: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: c }).format(v);

function DealsDashboard() {
  const [type, setType] = React.useState<"all" | DealType>("all");
  const [scope, setScope] = React.useState<"all" | Scope>("all");
  const [onlyHot, setOnlyHot] = React.useState(false);
  const [alertsOn, setAlertsOn] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("jaq.deals.alerts") !== "0";
  });
  const [subs, setSubs] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("jaq.deals.subs") || "{}");
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    localStorage.setItem("jaq.deals.alerts", alertsOn ? "1" : "0");
  }, [alertsOn]);
  React.useEffect(() => {
    localStorage.setItem("jaq.deals.subs", JSON.stringify(subs));
  }, [subs]);

  // Simulated push notifications for new deals
  React.useEffect(() => {
    if (!alertsOn) return;
    const hot = SEED.filter((d) => d.hot);
    let i = 0;
    const t = setInterval(() => {
      const d = hot[i % hot.length];
      i++;
      toast(`🔥 Promoção ${d.type === "flight" ? "voo" : "hotel"} • -${d.discount}%`, {
        description: `${d.title} por ${fmt(d.price, d.currency)} — expira em ${d.expiresInH}h`,
        duration: 5000,
      });
    }, 18000);
    return () => clearInterval(t);
  }, [alertsOn]);

  const deals = React.useMemo(() => {
    return SEED.filter((d) => (type === "all" ? true : d.type === type))
      .filter((d) => (scope === "all" ? true : d.scope === scope))
      .filter((d) => (onlyHot ? d.hot : true))
      .sort((a, b) => b.discount - a.discount);
  }, [type, scope, onlyHot]);

  const stats = React.useMemo(() => {
    const flights = SEED.filter((d) => d.type === "flight");
    const stays = SEED.filter((d) => d.type === "stay");
    const avg =
      Math.round(
        SEED.reduce((s, d) => s + d.discount, 0) / SEED.length,
      ) || 0;
    const hot = SEED.filter((d) => d.hot).length;
    return { flights: flights.length, stays: stays.length, avg, hot };
  }, []);

  const toggleSub = (id: string, title: string) => {
    setSubs((s) => {
      const next = { ...s, [id]: !s[id] };
      toast(next[id] ? "🔔 Alerta ativado" : "🔕 Alerta removido", {
        description: title,
      });
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 text-primary" /> JAQ Deals
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Alertas de <span className="text-gradient">voos & hotéis</span> em promoção
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Promoções nacionais e internacionais em tempo real. Ative alertas e seja avisado
            antes que acabem.
          </p>
        </div>
        <Button
          variant={alertsOn ? "default" : "outline"}
          onClick={() => {
            setAlertsOn((v) => !v);
            toast(alertsOn ? "Notificações pausadas" : "🔔 Notificações ativadas", {
              description: alertsOn
                ? "Você não receberá novos alertas."
                : "Você será avisado de novas promoções.",
            });
          }}
          className="gap-2"
        >
          {alertsOn ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {alertsOn ? "Alertas ativados" : "Ativar alertas"}
        </Button>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Plane} label="Voos em promo" value={String(stats.flights)} />
        <StatCard icon={BedDouble} label="Hospedagens" value={String(stats.stays)} />
        <StatCard
          icon={TrendingDown}
          label="Desconto médio"
          value={`-${stats.avg}%`}
          accent
        />
        <StatCard icon={Flame} label="Ofertas quentes" value={String(stats.hot)} />
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/40 p-3">
        <div className="mr-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filtros
        </div>
        <Chip active={type === "all"} onClick={() => setType("all")}>
          Tudo
        </Chip>
        <Chip active={type === "flight"} onClick={() => setType("flight")}>
          <Plane className="h-3 w-3" /> Voos
        </Chip>
        <Chip active={type === "stay"} onClick={() => setType("stay")}>
          <BedDouble className="h-3 w-3" /> Hospedagens
        </Chip>
        <span className="mx-2 hidden h-5 w-px bg-border md:inline-block" />
        <Chip active={scope === "all"} onClick={() => setScope("all")}>
          <Globe className="h-3 w-3" /> Todos
        </Chip>
        <Chip active={scope === "national"} onClick={() => setScope("national")}>
          <MapPin className="h-3 w-3" /> Nacional
        </Chip>
        <Chip active={scope === "international"} onClick={() => setScope("international")}>
          <Globe className="h-3 w-3" /> Internacional
        </Chip>
        <span className="mx-2 hidden h-5 w-px bg-border md:inline-block" />
        <Chip active={onlyHot} onClick={() => setOnlyHot((v) => !v)}>
          <Flame className="h-3 w-3" /> Quentes
        </Chip>
      </section>

      {/* Deals grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deals.map((d) => (
          <DealCard
            key={d.id}
            deal={d}
            subscribed={!!subs[d.id]}
            onToggle={() => toggleSub(d.id, d.title)}
          />
        ))}
        {deals.length === 0 && (
          <div className="col-span-full grid place-items-center rounded-xl border border-dashed border-border p-10 text-sm text-muted-foreground">
            Nenhuma promoção encontrada com esses filtros.
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/60 p-4",
        accent && "bg-gradient-primary/10",
      )}
    >
      <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-background hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function DealCard({
  deal,
  subscribed,
  onToggle,
}: {
  deal: Deal;
  subscribed: boolean;
  onToggle: () => void;
}) {
  const Icon = deal.type === "flight" ? Plane : BedDouble;
  const navigate = useNavigate();
  const hasApi = deal.type === "flight" ? HAS_FLIGHT_API : HAS_STAY_API;
  const externalUrl = externalBookingUrl(deal);

  const onBook = () => {
    if (hasApi) {
      navigate({ to: deal.type === "flight" ? "/flights" : "/stays" });
      toast("Abrindo reserva", {
        description: `Buscando ${deal.type === "flight" ? "voo" : "hotel"} para ${deal.destination}…`,
      });
    } else {
      window.open(externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card/60 p-4 transition-all hover:border-primary/40 hover:shadow-elegant">
      {deal.hot && (
        <div className="absolute right-3 top-3">
          <Badge className="gap-1 bg-orange-500/15 text-orange-400 hover:bg-orange-500/15">
            <Flame className="h-3 w-3" /> Hot
          </Badge>
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {deal.type === "flight" ? "Voo" : "Hospedagem"} •{" "}
            {deal.scope === "national" ? "Nacional" : "Internacional"}
          </span>
          <span className="text-xs text-muted-foreground">
            {deal.airline || deal.hotel}
          </span>
        </div>
      </div>

      <h3 className="mb-1 text-base font-semibold leading-tight">{deal.title}</h3>
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> {deal.destination}, {deal.country} • {deal.date}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-muted-foreground line-through">
            {fmt(deal.oldPrice, deal.currency)}
          </div>
          <div className="text-2xl font-black text-primary">
            {fmt(deal.price, deal.currency)}
          </div>
          {deal.nights && (
            <div className="text-[11px] text-muted-foreground">
              {deal.nights} noites
            </div>
          )}
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">
          -{deal.discount}%
        </Badge>
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-3">
        <Button
          size="sm"
          className="h-9 w-full gap-1 text-xs font-semibold"
          onClick={onBook}
        >
          {hasApi ? (
            <>
              <ShoppingBag className="h-3.5 w-3.5" />
              Reservar agora • {fmt(deal.price, deal.currency)}
            </>
          ) : (
            <>
              <ExternalLink className="h-3.5 w-3.5" />
              Reservar no site oficial
            </>
          )}
        </Button>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            ⏳ expira em {deal.expiresInH}h
          </span>
          <div className="flex items-center gap-2">
            {hasApi && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Comparar preço ↗
              </a>
            )}
            <Button
              size="sm"
              variant={subscribed ? "default" : "outline"}
              className="h-7 gap-1 text-[11px]"
              onClick={onToggle}
            >
              {subscribed ? (
                <>
                  <BellRing className="h-3 w-3" /> Avisando
                </>
              ) : (
                <>
                  <Bell className="h-3 w-3" /> Avise-me
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
