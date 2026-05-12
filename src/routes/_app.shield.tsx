import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ScanLine,
  Cloud,
  Clock,
  DollarSign,
  Phone,
  Languages,
  Wifi,
  Share2,
  Activity,
  Sparkles,
  ChevronRight,
  Camera,
  QrCode,
  Hotel,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/shield")({
  head: () => ({
    meta: [
      { title: "JAQ Shield — Proteção inteligente em tempo real" },
      {
        name: "description",
        content:
          "Dashboard de proteção turística com mapa de riscos, alertas ao vivo, scanner de golpes e score de segurança da viagem.",
      },
    ],
  }),
  component: ShieldDashboard,
});

// --- Mock data --------------------------------------------------------------

type RiskLevel = "low" | "medium" | "high";

const ALERTS: {
  id: string;
  title: string;
  level: RiskLevel;
  time: string;
  distance: string;
  desc: string;
}[] = [
  {
    id: "1",
    title: "Golpe de táxi relatado próximo",
    level: "high",
    time: "há 4 min",
    distance: "180 m",
    desc: "Motorista cobrando 3x o valor da corrida na região da estação central.",
  },
  {
    id: "2",
    title: "Área com muitos furtos",
    level: "high",
    time: "há 12 min",
    distance: "420 m",
    desc: "Concentração de batedores de carteira em rua turística movimentada.",
  },
  {
    id: "3",
    title: "Preço acima da média detectado",
    level: "medium",
    time: "há 22 min",
    distance: "60 m",
    desc: "Restaurante cobrando 38% acima do preço médio turístico local.",
  },
  {
    id: "4",
    title: "Cambistas ilegais relatados",
    level: "medium",
    time: "há 1 h",
    distance: "1.2 km",
    desc: "Casa de câmbio sem registro oficial oferecendo taxas suspeitas.",
  },
];

const COMMON_SCAMS = [
  {
    title: "Pulseira da amizade",
    freq: "Muito frequente",
    tip: "Não estenda a mão para vendedores ambulantes em áreas turísticas.",
    emoji: "📿",
  },
  {
    title: "Anel do chão",
    freq: "Frequente",
    tip: "Ignore quem 'achar' uma joia perto de você — é falsa.",
    emoji: "💍",
  },
  {
    title: "Petição falsa",
    freq: "Frequente",
    tip: "Enquanto você assina, cúmplices furtam sua mochila.",
    emoji: "📝",
  },
  {
    title: "Táxi sem taxímetro",
    freq: "Muito frequente",
    tip: "Use apps oficiais ou exija taxímetro ligado antes de embarcar.",
    emoji: "🚖",
  },
  {
    title: "ATM adulterado",
    freq: "Ocasional",
    tip: "Prefira caixas dentro de bancos. Cubra o teclado ao digitar a senha.",
    emoji: "🏧",
  },
];

// Risk markers are generated dynamically around the user's position.
type RiskPoint = { lat: number; lng: number; level: RiskLevel; label: string };

function generateRisksAround([lat, lng]: [number, number]): RiskPoint[] {
  // Deterministic-ish offsets in degrees (~100-500m at mid latitudes)
  const offsets: { dx: number; dy: number; level: RiskLevel; label: string }[] = [
    { dx: 0.004, dy: 0.002, level: "high", label: "Furtos relatados" },
    { dx: -0.003, dy: 0.005, level: "medium", label: "Golpe de táxi" },
    { dx: 0.006, dy: -0.004, level: "high", label: "Pickpockets" },
    { dx: -0.005, dy: -0.002, level: "low", label: "Polícia turística" },
    { dx: 0.002, dy: 0.007, level: "medium", label: "Preços abusivos" },
    { dx: -0.007, dy: 0.001, level: "low", label: "Zona segura" },
  ];
  return offsets.map((o) => ({
    lat: lat + o.dy,
    lng: lng + o.dx,
    level: o.level,
    label: o.label,
  }));
}

const FALLBACK_POS: [number, number] = [48.8566, 2.3522];

// --- Live location hook ----------------------------------------------------

type LocStatus = "idle" | "asking" | "granted" | "denied" | "unsupported";

type LiveLocation = {
  status: LocStatus;
  pos: [number, number] | null;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  weather: { temp: number; code: number } | null;
  request: () => void;
};

const WEATHER_EMOJI: Record<number, string> = {
  0: "☀️",
  1: "🌤",
  2: "⛅",
  3: "☁️",
  45: "🌫",
  48: "🌫",
  51: "🌦",
  61: "🌧",
  63: "🌧",
  65: "🌧",
  71: "🌨",
  73: "🌨",
  75: "❄️",
  80: "🌦",
  95: "⛈",
};

function useLiveLocation(): LiveLocation {
  const [status, setStatus] = React.useState<LocStatus>("idle");
  const [pos, setPos] = React.useState<[number, number] | null>(null);
  const [city, setCity] = React.useState<string | null>(null);
  const [country, setCountry] = React.useState<string | null>(null);
  const [countryCode, setCountryCode] = React.useState<string | null>(null);
  const [weather, setWeather] = React.useState<{ temp: number; code: number } | null>(null);

  const request = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setStatus("granted");
        setPos([p.coords.latitude, p.coords.longitude]);
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  // Auto-ask once on mount
  React.useEffect(() => {
    request();
  }, [request]);

  // Reverse geocode + weather when pos changes
  React.useEffect(() => {
    if (!pos) return;
    const [lat, lng] = pos;
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`,
          { signal: ctrl.signal },
        );
        const j = await r.json();
        setCity(j.city || j.locality || j.principalSubdivision || null);
        setCountry(j.countryName || null);
        setCountryCode(j.countryCode || null);
      } catch {
        /* ignore */
      }
      try {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`,
          { signal: ctrl.signal },
        );
        const j = await r.json();
        if (j?.current) {
          setWeather({ temp: Math.round(j.current.temperature_2m), code: j.current.weather_code });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => ctrl.abort();
  }, [pos]);

  return { status, pos, city, country, countryCode, weather, request };
}

// --- Helpers ---------------------------------------------------------------

const levelStyles = (l: RiskLevel) => {
  switch (l) {
    case "high":
      return {
        text: "text-red-400",
        bg: "bg-red-500/15",
        ring: "ring-red-500/40",
        dot: "bg-red-500",
        label: "Risco alto",
      };
    case "medium":
      return {
        text: "text-yellow-300",
        bg: "bg-yellow-500/15",
        ring: "ring-yellow-500/40",
        dot: "bg-yellow-400",
        label: "Atenção",
      };
    default:
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/15",
        ring: "ring-emerald-500/40",
        dot: "bg-emerald-500",
        label: "Seguro",
      };
  }
};

// --- Components ------------------------------------------------------------

function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.18_0.025_260/0.55)] p-5 backdrop-blur-xl",
        "shadow-[0_10px_40px_-12px_oklch(0.05_0_0/0.6)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
      <div className="relative">{children}</div>
    </div>
  );
}

function ShieldHeader({
  protectionActive,
  loc,
}: {
  protectionActive: boolean;
  loc: LiveLocation;
}) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(i);
  }, []);

  const cityLabel =
    loc.status === "asking"
      ? "Localizando…"
      : loc.status === "denied"
        ? "Permissão negada"
        : loc.status === "unsupported"
          ? "Indisponível"
          : loc.city
            ? `${loc.city}${loc.countryCode ? ", " + loc.countryCode : ""}`
            : "—";

  const weatherLabel = loc.weather
    ? `${loc.weather.temp}° ${WEATHER_EMOJI[loc.weather.code] ?? ""}`
    : loc.status === "granted"
      ? "…"
      : "—";

  return (
    <GlassCard className="!p-6 md:!p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5" /> JAQ Shield
          </div>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Você está <span className="text-gradient">protegido</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loc.status === "denied" || loc.status === "unsupported" ? (
              <>
                Ative a localização para alertas em tempo real.{" "}
                <button
                  onClick={loc.request}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  Tentar novamente
                </button>
              </>
            ) : (
              "Monitoramento contínuo da sua viagem em tempo real."
            )}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoChip icon={MapPin} label="Cidade" value={cityLabel} />
          <InfoChip icon={Cloud} label="Clima" value={weatherLabel} />
          <InfoChip
            icon={Clock}
            label="Hora local"
            value={now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          />
          <InfoChip
            icon={Shield}
            label="Status"
            value={protectionActive ? "Ativo" : "Stand-by"}
            tone={protectionActive ? "ok" : "muted"}
          />
        </div>
      </div>
    </GlassCard>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "ok" | "muted";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div
        className={cn(
          "mt-1 text-sm font-semibold",
          tone === "ok" && "text-emerald-400",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreCard({ score }: { score: number }) {
  const level: RiskLevel = score >= 75 ? "low" : score >= 50 ? "medium" : "high";
  const s = levelStyles(level);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Status da viagem
          </div>
          <div className="mt-1 text-lg font-semibold">Score de segurança</div>
        </div>
        <Badge className={cn("border-0", s.bg, s.text)}>{s.label}</Badge>
      </div>
      <div className="mt-6 flex items-center gap-6">
        <div className="relative h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" stroke="oklch(1 0 0 / 0.08)" strokeWidth="10" fill="none" />
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke={
                level === "low"
                  ? "oklch(0.72 0.17 150)"
                  : level === "medium"
                    ? "oklch(0.78 0.18 80)"
                    : "oklch(0.65 0.24 25)"
              }
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              fill="none"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-bold">{score}</div>
              <div className="text-[10px] uppercase text-muted-foreground">de 100</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm text-foreground">
            Sua região atual apresenta <span className={s.text}>baixo risco turístico</span>.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-400">
              ✓ Polícia próxima
            </span>
            <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-400">
              ✓ Bem iluminado
            </span>
            <span className="rounded-md bg-yellow-500/10 px-2 py-1 text-yellow-300">
              ! Pickpockets ocasionais
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function RiskMap({ center, live }: { center: [number, number]; live: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<import("leaflet").Map | null>(null);
  const layerRef = React.useRef<import("leaflet").LayerGroup | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, {
        center,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });
      mapRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Re-render markers when center changes
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer || cancelled) return;
      map.setView(center, 14);
      layer.clearLayers();

      const userIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:28px;height:28px">
          <div style="position:absolute;inset:0;border-radius:9999px;background:oklch(0.7 0.22 240);opacity:0.4;animation:jaq-ping 2s cubic-bezier(0,0,0.2,1) infinite"></div>
          <div style="position:absolute;inset:6px;border-radius:9999px;background:oklch(0.78 0.2 220);box-shadow:0 0 12px oklch(0.7 0.22 240)"></div>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker(center, { icon: userIcon }).bindTooltip(live ? "Você está aqui" : "Posição padrão", { direction: "top" }).addTo(layer);

      generateRisksAround(center).forEach((r) => {
        const color =
          r.level === "high" ? "#ef4444" : r.level === "medium" ? "#facc15" : "#10b981";
        L.circle([r.lat, r.lng], {
          radius: r.level === "high" ? 350 : r.level === "medium" ? 250 : 200,
          color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.25,
        })
          .addTo(layer)
          .bindTooltip(r.label, { direction: "top" });
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [center, live]);

  return (
    <GlassCard className="!p-0">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <div className="font-semibold">Mapa inteligente de riscos</div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <Legend color="bg-red-500" label="Golpes" />
          <Legend color="bg-yellow-400" label="Atenção" />
          <Legend color="bg-emerald-500" label="Seguro" />
        </div>
      </div>
      <div
        ref={ref}
        className="h-[360px] w-full rounded-b-2xl"
        style={{ background: "oklch(0.12 0.02 260)" }}
      />
    </GlassCard>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", color)} /> {label}
    </span>
  );
}

function AlertsFeed() {
  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <div className="font-semibold">Alertas ao vivo</div>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          {ALERTS.length} ativos
        </Badge>
      </div>
      <div className="space-y-3">
        {ALERTS.map((a) => {
          const s = levelStyles(a.level);
          return (
            <div
              key={a.id}
              className={cn(
                "group rounded-xl border border-white/5 bg-white/[0.02] p-3 ring-1 transition-all hover:bg-white/[0.04]",
                s.ring,
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-1 grid h-8 w-8 place-items-center rounded-lg", s.bg)}>
                  <AlertTriangle className={cn("h-4 w-4", s.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{a.title}</div>
                    <Badge className={cn("border-0 text-[10px]", s.bg, s.text)}>{s.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{a.time}</span>
                      <span>•</span>
                      <span>{a.distance}</span>
                    </div>
                    <button
                      onClick={() => toast.info(a.title, { description: a.desc })}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Ver detalhes <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function PriceWatch() {
  const items = [
    { name: "Le Petit Bistro", avg: 22, charged: 38, type: "Restaurante" },
    { name: "Hotel Lumière", avg: 140, charged: 152, type: "Hotel" },
    { name: "Tour Eiffel — café", avg: 4, charged: 9, type: "Café" },
  ];
  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        <div className="font-semibold">Painel de preços</div>
      </div>
      <div className="space-y-3">
        {items.map((it) => {
          const diff = Math.round(((it.charged - it.avg) / it.avg) * 100);
          const bad = diff > 25;
          const warn = diff > 10 && diff <= 25;
          return (
            <div
              key={it.name}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{it.name}</div>
                  <div className="text-[11px] text-muted-foreground">{it.type}</div>
                </div>
                <div
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-semibold",
                    bad
                      ? "bg-red-500/15 text-red-400"
                      : warn
                        ? "bg-yellow-500/15 text-yellow-300"
                        : "bg-emerald-500/15 text-emerald-400",
                  )}
                >
                  {diff > 0 ? "+" : ""}
                  {diff}%
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                Médio: €{it.avg} · Cobrado: <span className="text-foreground">€{it.charged}</span>
              </div>
              {bad && (
                <p className="mt-2 text-xs text-red-300">
                  ⚠ Possível golpe turístico — {diff}% acima da média da região.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function ScamsCarousel() {
  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <div className="font-semibold">Golpes comuns na França</div>
      </div>
      <div className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2">
        {COMMON_SCAMS.map((s) => (
          <div
            key={s.title}
            className="min-w-[220px] snap-start rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-primary/5 p-4"
          >
            <div className="text-3xl">{s.emoji}</div>
            <div className="mt-2 font-semibold">{s.title}</div>
            <Badge variant="outline" className="mt-1 border-yellow-500/30 text-[10px] text-yellow-300">
              {s.freq}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">{s.tip}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ScannerFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105 md:bottom-8 md:right-8"
    >
      <ScanLine className="h-4 w-4" />
      Escanear local
    </button>
  );
}

function ScannerSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const tools = [
    { icon: Utensils, label: "Restaurante" },
    { icon: Hotel, label: "Hotel" },
    { icon: QrCode, label: "QR Code" },
    { icon: DollarSign, label: "Preço" },
    { icon: AlertTriangle, label: "Risco" },
    { icon: Camera, label: "Foto" },
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/60 backdrop-blur-sm md:place-items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[oklch(0.16_0.02_260)] p-6 md:rounded-3xl"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-white/20 md:hidden" />
        <h3 className="mt-4 text-lg font-semibold">Scanner IA</h3>
        <p className="text-sm text-muted-foreground">Escolha o que deseja analisar.</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {tools.map((t) => (
            <button
              key={t.label}
              onClick={() => {
                toast.success(`Analisando ${t.label.toLowerCase()}…`, {
                  description: "Resultado em segundos.",
                });
                onClose();
              }}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs hover:border-primary/40 hover:bg-primary/5"
            >
              <t.icon className="h-5 w-5 text-primary" />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProtectionToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <GlassCard className="overflow-visible">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className={cn(
              "grid h-14 w-14 place-items-center rounded-2xl transition-all",
              active ? "bg-gradient-primary shadow-glow" : "bg-white/5",
            )}
          >
            <ShieldCheck
              className={cn(
                "h-7 w-7",
                active ? "text-primary-foreground" : "text-muted-foreground",
              )}
            />
          </div>
          {active && (
            <span className="pointer-events-none absolute -inset-1 animate-ping rounded-2xl bg-primary/30" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold">Modo Turista Protegido</div>
          <p className="text-xs text-muted-foreground">
            Monitoramento contínuo, alertas automáticos, rotas seguras e notificações contextuais.
          </p>
        </div>
        <Button
          onClick={onToggle}
          className={cn(
            "shrink-0",
            active ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gradient-primary",
          )}
        >
          {active ? "Ativo" : "Ativar proteção total"}
        </Button>
      </div>
    </GlassCard>
  );
}

function Widgets() {
  const items = [
    { icon: Cloud, label: "Clima", value: "18° · Nublado" },
    { icon: DollarSign, label: "Câmbio EUR/BRL", value: "5,82" },
    { icon: Languages, label: "Tradução rápida", value: "Olá → Bonjour" },
    { icon: Share2, label: "Compartilhar local", value: "Família" },
    { icon: Wifi, label: "Modo offline", value: "Disponível" },
    { icon: Phone, label: "SOS internacional", value: "112 · FR" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {items.map((it) => (
        <button
          key={it.label}
          onClick={() => toast.info(it.label, { description: it.value })}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <it.icon className="h-3 w-3" /> {it.label}
          </div>
          <div className="mt-1 truncate text-sm font-semibold">{it.value}</div>
        </button>
      ))}
    </div>
  );
}

// --- Page ------------------------------------------------------------------

function ShieldDashboard() {
  const [protectionActive, setProtectionActive] = React.useState(true);
  const [scannerOpen, setScannerOpen] = React.useState(false);

  return (
    <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-10">
      <style>{`@keyframes jaq-ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }`}</style>

      <ShieldHeader protectionActive={protectionActive} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ScoreCard score={82} />
          <RiskMap />
          <PriceWatch />
        </div>
        <div className="space-y-6">
          <ProtectionToggle
            active={protectionActive}
            onToggle={() => {
              setProtectionActive((a) => !a);
              toast.success(
                protectionActive ? "Proteção pausada" : "Proteção total ativada",
              );
            }}
          />
          <AlertsFeed />
        </div>
      </div>

      <ScamsCarousel />
      <Widgets />

      <ScannerFab onClick={() => setScannerOpen(true)} />
      <ScannerSheet open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
}
