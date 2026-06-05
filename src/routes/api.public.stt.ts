import { createFileRoute } from "@tanstack/react-router";

// ElevenLabs Scribe language codes (ISO 639-3). Map our BCP-47 codes to them.
const LANG_MAP: Record<string, string> = {
  "pt-BR": "por",
  "en-US": "eng",
  "es-ES": "spa",
  "fr-FR": "fra",
  "it-IT": "ita",
  "de-DE": "deu",
  "ja-JP": "jpn",
  "zh-CN": "zho",
  "ko-KR": "kor",
  "ar-SA": "ara",
  "ru-RU": "rus",
  "nl-NL": "nld",
  "tr-TR": "tur",
  "hi-IN": "hin",
};

export const Route = createFileRoute("/api/public/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "ElevenLabs not configured" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        let inForm: FormData;
        try {
          inForm = await request.formData();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid form data" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const audio = inForm.get("audio");
        if (!(audio instanceof File) && !(audio instanceof Blob)) {
          return new Response(JSON.stringify({ error: "Missing audio" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const langRaw = (inForm.get("lang") as string) || "";
        const langCode = LANG_MAP[langRaw];

        const apiForm = new FormData();
        apiForm.append("file", audio, "audio.webm");
        apiForm.append("model_id", "scribe_v2");
        apiForm.append("tag_audio_events", "false");
        apiForm.append("diarize", "false");
        if (langCode) apiForm.append("language_code", langCode);

        const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": apiKey },
          body: apiForm,
        });

        if (!resp.ok) {
          const err = await resp.text();
          return new Response(JSON.stringify({ error: err || `STT failed: ${resp.status}` }), {
            status: 502,
            headers: { "content-type": "application/json" },
          });
        }

        const data = (await resp.json()) as { text?: string };
        return new Response(JSON.stringify({ text: (data.text || "").trim() }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
