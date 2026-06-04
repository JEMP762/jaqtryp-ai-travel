import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Camera,
  ArrowLeftRight,
  Star,
  Trash2,
  Loader2,
  Languages,
  Users,
  Megaphone,
  Ship,
  Bluetooth,
  Glasses,
  Sparkles,
  Image as ImageIcon,
  Send,
} from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/live-translator")({
  component: LiveTranslatorPage,
});

const LANGS = [
  { code: "pt-BR", label: "Português (BR)", short: "pt" },
  { code: "en-US", label: "English (US)", short: "en" },
  { code: "es-ES", label: "Español", short: "es" },
  { code: "fr-FR", label: "Français", short: "fr" },
  { code: "it-IT", label: "Italiano", short: "it" },
  { code: "de-DE", label: "Deutsch", short: "de" },
  { code: "ja-JP", label: "日本語", short: "ja" },
  { code: "zh-CN", label: "中文 (简体)", short: "zh" },
  { code: "ko-KR", label: "한국어", short: "ko" },
  { code: "ar-SA", label: "العربية", short: "ar" },
  { code: "ru-RU", label: "Русский", short: "ru" },
  { code: "nl-NL", label: "Nederlands", short: "nl" },
  { code: "tr-TR", label: "Türkçe", short: "tr" },
  { code: "hi-IN", label: "हिन्दी", short: "hi" },
];

type HistoryItem = {
  id: string;
  source: string;
  translated: string;
  from: string;
  to: string;
  ts: number;
  favorite?: boolean;
};

type Mode = "conversation" | "guide" | "cruise";

const HISTORY_KEY = "jaq-live-translator-history-v1";

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 200)));
}

function langLabel(code: string) {
  return LANGS.find((l) => l.code === code)?.label ?? code;
}

async function translateText(
  text: string,
  fromCode: string,
  toCode: string,
): Promise<string> {
  const from = langLabel(fromCode);
  const to = langLabel(toCode);
  const system = `You are a professional simultaneous interpreter. Translate the user's text from ${from} to ${to}. Output ONLY the translation, with no quotes, no explanations, no transliteration. Preserve names, numbers and punctuation. Use natural, conversational tone suitable for spoken delivery.`;
  const resp = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, prompt: text }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Erro de tradução");
  return (data.text as string).trim();
}

async function ocrAndTranslate(
  dataUrl: string,
  toCode: string,
): Promise<{ original: string; translated: string }> {
  const to = langLabel(toCode);
  const system = `You read text from images (signs, menus, documents, billboards). Return a JSON object with two fields: "original" (the text exactly as it appears, preserving line breaks) and "translated" (the same text translated to ${to}, natural and idiomatic). Output ONLY valid JSON, no markdown fences.`;
  const resp = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      prompt: "Extract and translate all visible text.",
      image: dataUrl,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || "Erro OCR");
  const raw = (data.text as string).trim().replace(/^```json\s*|\s*```$/g, "");
  try {
    const parsed = JSON.parse(raw);
    return {
      original: String(parsed.original || ""),
      translated: String(parsed.translated || ""),
    };
  } catch {
    return { original: "", translated: raw };
  }
}

function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    toast.error("Seu navegador não suporta síntese de voz.");
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1;
  window.speechSynthesis.speak(u);
}

// Minimal SpeechRecognition typing
type SRConstructor = new () => SpeechRecognition;
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>; resultIndex: number }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getSR(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor;
    webkitSpeechRecognition?: SRConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function useSpeechRecognition(lang: string, onFinal: (text: string) => void) {
  const [listening, setListening] = React.useState(false);
  const [interim, setInterim] = React.useState("");
  const recRef = React.useRef<SpeechRecognition | null>(null);
  const supported = !!getSR();

  const start = React.useCallback(() => {
    const SR = getSR();
    if (!SR) {
      toast.error("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let intr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinal(r[0].transcript.trim());
        else intr += r[0].transcript;
      }
      setInterim(intr);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted" && e.error !== "no-speech") {
        toast.error(`Microfone: ${e.error}`);
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [lang, onFinal]);

  const stop = React.useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  React.useEffect(() => () => recRef.current?.stop(), []);

  return { listening, interim, start, stop, supported };
}

function LiveTranslatorPage() {
  const [from, setFrom] = React.useState("pt-BR");
  const [to, setTo] = React.useState("en-US");
  const [text, setText] = React.useState("");
  const [translated, setTranslated] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [mode, setMode] = React.useState<Mode>("conversation");
  const [autoSpeak, setAutoSpeak] = React.useState(true);
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const persist = (next: HistoryItem[]) => {
    setHistory(next);
    saveHistory(next);
  };

  const addHistory = React.useCallback(
    (source: string, translatedText: string, f: string, t: string) => {
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        source,
        translated: translatedText,
        from: f,
        to: t,
        ts: Date.now(),
      };
      persist([item, ...loadHistory()]);
    },
    [],
  );

  const doTranslate = React.useCallback(
    async (input: string, f = from, t = to, speakOut = autoSpeak) => {
      if (!input.trim()) return;
      setLoading(true);
      try {
        const out = await translateText(input, f, t);
        setTranslated(out);
        addHistory(input, out, f, t);
        if (speakOut) speak(out, t);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [from, to, autoSpeak, addHistory],
  );

  // STT — handle final transcription
  const onFinalA = React.useCallback(
    (txt: string) => {
      setText(txt);
      doTranslate(txt, from, to, true);
    },
    [doTranslate, from, to],
  );

  const onFinalB = React.useCallback(
    (txt: string) => {
      // In conversation mode, B speaks in `to` lang and we translate back to `from`
      setText(txt);
      doTranslate(txt, to, from, true);
    },
    [doTranslate, from, to],
  );

  const srA = useSpeechRecognition(from, onFinalA);
  const srB = useSpeechRecognition(to, onFinalB);

  const swap = () => {
    const f = from;
    setFrom(to);
    setTo(f);
    setText("");
    setTranslated("");
  };

  const handleImage = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setOcrLoading(true);
      try {
        const { original, translated: tr } = await ocrAndTranslate(dataUrl, to);
        setText(original);
        setTranslated(tr);
        addHistory(original || "[imagem]", tr, from, to);
        if (autoSpeak && tr) speak(tr, to);
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleFavorite = (id: string) => {
    const next = history.map((h) =>
      h.id === id ? { ...h, favorite: !h.favorite } : h,
    );
    persist(next);
  };

  const removeItem = (id: string) => {
    persist(history.filter((h) => h.id !== id));
  };

  const clearHistory = () => {
    if (confirm("Limpar todo o histórico?")) persist([]);
  };

  // Quick phrases per destination via AI
  const [destination, setDestination] = React.useState("");
  const [phrases, setPhrases] = React.useState<string[]>([]);
  const [phrasesLoading, setPhrasesLoading] = React.useState(false);

  const suggestPhrases = async () => {
    if (!destination.trim()) {
      toast.error("Informe um destino");
      return;
    }
    setPhrasesLoading(true);
    setPhrases([]);
    try {
      const system = `You are a travel concierge. Return ONLY a JSON array of 8 short, highly useful phrases a tourist would say in ${langLabel(to)} when visiting ${destination}. No numbering, no commentary, no markdown fences. Example: ["...","..."].`;
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, prompt: `Destination: ${destination}` }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro");
      const raw = (data.text as string).trim().replace(/^```json\s*|\s*```$/g, "");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) setPhrases(arr.slice(0, 12).map(String));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPhrasesLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <Languages className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Live Translator & Smart Glasses</h1>
            <p className="text-sm text-muted-foreground">
              Tradução simultânea por voz, texto e imagem
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Bluetooth className="h-3 w-3" /> Saída: dispositivo do sistema
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Glasses className="h-3 w-3" /> AR Glasses em breve
          </Badge>
        </div>
      </div>

      {/* Language bar */}
      <div className="mb-4 grid grid-cols-1 items-end gap-3 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-[1fr_auto_1fr_auto]">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">De</label>
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={swap} aria-label="Inverter idiomas">
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Para</label>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGS.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant={autoSpeak ? "default" : "outline"}
          onClick={() => setAutoSpeak((v) => !v)}
          className={autoSpeak ? "bg-gradient-primary" : ""}
        >
          <Volume2 className="h-4 w-4" /> Auto-falar
        </Button>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversation" className="gap-1">
            <Users className="h-4 w-4" /> Conversação
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-1">
            <Megaphone className="h-4 w-4" /> Guia
          </TabsTrigger>
          <TabsTrigger value="cruise" className="gap-1">
            <Ship className="h-4 w-4" /> Cruzeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SpeakerCard
              title={`Pessoa A — ${langLabel(from)}`}
              listening={srA.listening}
              interim={srA.interim}
              onStart={() => {
                srB.stop();
                srA.start();
              }}
              onStop={srA.stop}
            />
            <SpeakerCard
              title={`Pessoa B — ${langLabel(to)}`}
              listening={srB.listening}
              interim={srB.interim}
              onStart={() => {
                srA.stop();
                srB.start();
              }}
              onStop={srB.stop}
              accent
            />
          </div>
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <p className="mb-3 text-sm text-muted-foreground">
              Modo guia turístico: você fala em <strong>{langLabel(from)}</strong> e a
              tradução para <strong>{langLabel(to)}</strong> é exibida e falada para os
              ouvintes conectados ao mesmo dispositivo de saída.
            </p>
            <SpeakerCard
              title={`Locutor — ${langLabel(from)}`}
              listening={srA.listening}
              interim={srA.interim}
              onStart={srA.start}
              onStop={srA.stop}
            />
          </div>
        </TabsContent>

        <TabsContent value="cruise" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Frases rápidas para excursões, recepção e restaurantes do navio.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Onde fica o restaurante principal?",
                "A que horas começa a excursão?",
                "Tem opção sem glúten?",
                "Quanto custa essa lembrança?",
                "Pode chamar o gerente, por favor?",
                "Qual o Wi-Fi do quarto?",
              ].map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setText(q);
                    doTranslate(q);
                  }}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Manual input + image */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Texto / Voz</h3>
            <div className="flex gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImage(f);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={ocrLoading}
              >
                {ocrLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                Foto
              </Button>
            </div>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doTranslate(text);
              }
            }}
            placeholder={`Digite em ${langLabel(from)} e pressione Enter (Shift+Enter = nova linha)...`}
            rows={3}
            autoFocus
            autoComplete="off"
            autoCorrect="on"
            spellCheck
            className="text-base"
          />
          <div className="flex gap-2">
            <Button
              variant={srA.listening ? "destructive" : "outline"}
              onClick={srA.listening ? srA.stop : srA.start}
              disabled={!srA.supported}
            >
              {srA.listening ? (
                <>
                  <MicOff className="h-4 w-4" /> Parar
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" /> Gravar
                </>
              )}
            </Button>
            <Button
              onClick={() => doTranslate(text)}
              disabled={loading || !text.trim()}
              className="flex-1 bg-gradient-primary shadow-glow"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Traduzir
            </Button>
          </div>
          {srA.interim && (
            <p className="text-xs italic text-muted-foreground">{srA.interim}</p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-primary/30 bg-gradient-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Tradução — {langLabel(to)}</h3>
            {translated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speak(translated, to)}
              >
                <Volume2 className="h-4 w-4" /> Ouvir
              </Button>
            )}
          </div>
          <div className="min-h-[140px] whitespace-pre-wrap rounded-lg bg-background/40 p-3 text-base">
            {translated || (
              <span className="text-muted-foreground">
                A tradução aparecerá aqui...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Phrases by destination */}
      <div className="mt-6 rounded-2xl border border-border bg-card/60 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Frases úteis por destino</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Ex: Tóquio, Paris, Cancún..."
            className="flex-1 min-w-[200px] rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <Button onClick={suggestPhrases} disabled={phrasesLoading}>
            {phrasesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Sugerir
          </Button>
        </div>
        {phrases.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {phrases.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/40 p-2 text-sm"
              >
                <span>{p}</span>
                <Button size="icon" variant="ghost" onClick={() => speak(p, to)}>
                  <Volume2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* History */}
      <div className="mt-6 rounded-2xl border border-border bg-card/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Histórico & Favoritos</h3>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory}>
              <Trash2 className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Suas traduções aparecerão aqui.
          </p>
        ) : (
          <ul className="space-y-2">
            {history.slice(0, 30).map((h) => (
              <li
                key={h.id}
                className="rounded-lg border border-border bg-background/40 p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {langLabel(h.from)} → {langLabel(h.to)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleFavorite(h.id)}
                      aria-label="Favoritar"
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5",
                          h.favorite && "fill-primary text-primary",
                        )}
                      />
                    </button>
                    <button onClick={() => speak(h.translated, h.to)} aria-label="Ouvir">
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => removeItem(h.id)} aria-label="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-muted-foreground">{h.source}</p>
                <p className="font-medium">{h.translated}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SpeakerCard({
  title,
  listening,
  interim,
  onStart,
  onStop,
  accent,
}: {
  title: string;
  listening: boolean;
  interim: string;
  onStart: () => void;
  onStop: () => void;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-colors",
        accent
          ? "border-primary/40 bg-gradient-card"
          : "border-border bg-card/60",
      )}
    >
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <Button
        size="lg"
        variant={listening ? "destructive" : "default"}
        onClick={listening ? onStop : onStart}
        className={cn(
          "w-full",
          !listening && "bg-gradient-primary shadow-glow",
        )}
      >
        {listening ? (
          <>
            <MicOff className="h-5 w-5" /> Parar
          </>
        ) : (
          <>
            <Mic className="h-5 w-5" /> Falar
          </>
        )}
      </Button>
      <div className="mt-3 min-h-[40px] rounded-lg bg-background/40 p-2 text-xs italic text-muted-foreground">
        {listening ? interim || "Ouvindo..." : "Toque em Falar e comece a conversar."}
      </div>
    </div>
  );
}

export default LiveTranslatorPage;
