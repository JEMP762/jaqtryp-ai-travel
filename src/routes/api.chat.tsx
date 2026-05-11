import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT_PT = `Você é o assistente Jaqtryp AI, especialista em turismo, viagens, voos, hotéis, vistos, cultura e dicas locais. Responda sempre em português (a menos que o usuário escreva em outro idioma). Seja prático, claro e use markdown (listas, negrito, títulos). Sempre que possível, sugira próximos passos.`;

const SYSTEM_PROMPT_EN = `You are the Jaqtryp AI assistant, specialized in travel, tourism, flights, hotels, visas, culture and local tips. Respond in the user's language. Be practical, concise and use markdown (lists, bold, headings). Suggest next steps when relevant.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "AI not configured" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        let body: { messages?: Msg[]; lang?: "pt" | "en" };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
        }
        const messages = Array.isArray(body.messages) ? body.messages.slice(-30) : [];
        const lang = body.lang === "en" ? "en" : "pt";
        const system = lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_PT;

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [{ role: "system", content: system }, ...messages],
          }),
        });

        if (!resp.ok) {
          const status = resp.status;
          const text = await resp.text().catch(() => "");
          let msg = "AI gateway error";
          if (status === 429) msg = "Limite atingido. Tente novamente em alguns instantes.";
          else if (status === 402)
            msg = "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage.";
          console.error("AI gateway error", status, text);
          return new Response(JSON.stringify({ error: msg }), {
            status,
            headers: { "content-type": "application/json" },
          });
        }

        return new Response(resp.body, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
          },
        });
      },
    },
  },
});
