import { createFileRoute } from "@tanstack/react-router";
import { ArrowRightLeft, Languages, Loader2, Volume2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/I18nProvider";

export const Route = createFileRoute("/_app/translator")({
  component: TranslatorPage,
});

const LANGS = [
  { code: "pt", name: "Português" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
  { code: "de", name: "Deutsch" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
  { code: "ko", name: "한국어" },
  { code: "ar", name: "العربية" },
  { code: "ru", name: "Русский" },
];

function TranslatorPage() {
  const { t } = useI18n();
  const [from, setFrom] = React.useState("pt");
  const [to, setTo] = React.useState("en");
  const [src, setSrc] = React.useState("");
  const [out, setOut] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const swap = () => {
    setFrom(to);
    setTo(from);
    setSrc(out);
    setOut(src);
  };

  const translate = async () => {
    if (!src.trim() || loading) return;
    setLoading(true);
    setOut("");
    try {
      const fromName = LANGS.find((l) => l.code === from)?.name ?? from;
      const toName = LANGS.find((l) => l.code === to)?.name ?? to;
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are a professional translator. Translate from ${fromName} to ${toName}. Return ONLY the translation, no explanations, no quotes.`,
          prompt: src,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro");
      setOut((data.text as string) ?? "");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string, lang: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          <Languages className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("dash.translator")}</h1>
          <p className="text-sm text-muted-foreground">100+ idiomas com IA</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger className="w-40 border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => speak(src, from)}
              disabled={!src}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="Digite o texto..."
            rows={8}
            className="resize-none border-0 bg-transparent focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center justify-center">
          <Button variant="outline" size="icon" onClick={swap} className="rounded-full">
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-gradient-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger className="w-40 border-0 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => speak(out, to)}
              disabled={!out}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="min-h-[200px] whitespace-pre-wrap text-sm">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Traduzindo...
              </div>
            ) : (
              out || <span className="text-muted-foreground">Tradução aparecerá aqui</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={translate}
          disabled={loading || !src.trim()}
          className="bg-gradient-primary shadow-glow"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
          Traduzir
        </Button>
      </div>
    </div>
  );
}
