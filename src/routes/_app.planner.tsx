import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";

export const Route = createFileRoute("/_app/planner")({
  component: PlannerPage,
});

const CURRENCIES = [
  { code: "BRL", label: "Real (R$)", symbol: "R$" },
  { code: "USD", label: "Dólar (US$)", symbol: "US$" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "GBP", label: "Libra (£)", symbol: "£" },
  { code: "ARS", label: "Peso Argentino ($)", symbol: "AR$" },
  { code: "CLP", label: "Peso Chileno ($)", symbol: "CL$" },
  { code: "JPY", label: "Iene (¥)", symbol: "¥" },
  { code: "CHF", label: "Franco Suíço (CHF)", symbol: "CHF" },
  { code: "CAD", label: "Dólar Canadense (C$)", symbol: "C$" },
  { code: "AUD", label: "Dólar Australiano (A$)", symbol: "A$" },
];

function PlannerPage() {
  const { lang } = useI18n();
  const [destination, setDestination] = React.useState("");
  const [days, setDays] = React.useState<string>("");
  const [budget, setBudget] = React.useState("");
  const [currency, setCurrency] = React.useState("BRL");
  const [interests, setInterests] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [plan, setPlan] = React.useState("");


  const generate = async () => {
    if (!destination.trim()) {
      toast.error("Informe um destino");
      return;
    }
    setLoading(true);
    setPlan("");
    try {
      const system =
        lang === "en"
          ? "You are an expert travel planner. Build a clear, well-structured day-by-day itinerary in English using markdown (## Day 1, bullet lists). Include morning/afternoon/evening, restaurant ideas, transport tips, and a budget summary at the end."
          : "Você é um planejador de viagens especialista. Monte um roteiro dia a dia claro e bem estruturado em português usando markdown (## Dia 1, listas). Inclua manhã/tarde/noite, ideias de restaurantes, dicas de transporte e um resumo de orçamento no final.";
      const prompt =
        lang === "en"
          ? `Plan a ${days}-day trip to ${destination}. Budget: ${budget || "not specified"}. Interests: ${interests || "general"}.`
          : `Planeje uma viagem de ${days} dias para ${destination}. Orçamento: ${budget || "não informado"}. Interesses: ${interests || "geral"}.`;

      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, prompt }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro");
      setPlan(data.text as string);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Planejador IA</h1>
          <p className="text-sm text-muted-foreground">Roteiro completo em segundos</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-card/60 p-6">
          <div className="space-y-1.5">
            <Label>Destino</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ex: Tóquio, Japão"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dias</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Orçamento</Label>
              <Input
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="US$ 2000"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Interesses</Label>
            <Textarea
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="gastronomia, museus, vida noturna..."
              rows={3}
            />
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            className="w-full bg-gradient-primary shadow-glow"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Gerar roteiro
              </>
            )}
          </Button>
        </div>

        <div className="min-h-[400px] rounded-2xl border border-border bg-gradient-card p-6">
          {plan ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{plan}</ReactMarkdown>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center text-muted-foreground">
              <div>
                <Sparkles className="mx-auto h-10 w-10 opacity-50" />
                <p className="mt-2 text-sm">
                  Preencha os dados e gere um roteiro completo dia a dia.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
