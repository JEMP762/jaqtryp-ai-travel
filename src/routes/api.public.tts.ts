import { createFileRoute } from "@tanstack/react-router";

const SUPPORTED_LANGS = new Set([
  "pt-BR",
  "en-US",
  "es-ES",
  "fr-FR",
  "it-IT",
  "de-DE",
  "ja-JP",
  "zh-CN",
  "ko-KR",
  "ar-SA",
  "ru-RU",
  "nl-NL",
  "tr-TR",
  "hi-IN",
]);

export const Route = createFileRoute("/api/public/tts")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const text = (url.searchParams.get("text") || "").trim().slice(0, 180);
        const lang = url.searchParams.get("lang") || "pt-BR";

        if (!text) return new Response("Missing text", { status: 400 });
        if (!SUPPORTED_LANGS.has(lang)) return new Response("Unsupported language", { status: 400 });

        const upstream = new URL("https://translate.google.com/translate_tts");
        upstream.searchParams.set("ie", "UTF-8");
        upstream.searchParams.set("client", "tw-ob");
        upstream.searchParams.set("tl", lang);
        upstream.searchParams.set("q", text);

        const resp = await fetch(upstream, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            Accept: "audio/mpeg,*/*;q=0.8",
          },
        });

        if (!resp.ok || !resp.body) return new Response("TTS unavailable", { status: 502 });

        return new Response(resp.body, {
          headers: {
            "content-type": resp.headers.get("content-type") || "audio/mpeg",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});