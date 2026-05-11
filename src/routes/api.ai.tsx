import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey)
          return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500 });

        const body = (await request.json().catch(() => null)) as {
          system?: string;
          prompt?: string;
          model?: string;
        } | null;
        if (!body?.prompt) {
          return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
        }

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: body.model || "google/gemini-3-flash-preview",
            messages: [
              ...(body.system ? [{ role: "system", content: body.system }] : []),
              { role: "user", content: body.prompt },
            ],
          }),
        });

        if (!resp.ok) {
          const status = resp.status;
          let msg = "AI gateway error";
          if (status === 429) msg = "Limite atingido. Tente novamente.";
          else if (status === 402) msg = "Créditos de IA esgotados.";
          return new Response(JSON.stringify({ error: msg }), {
            status,
            headers: { "content-type": "application/json" },
          });
        }
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content ?? "";
        return new Response(JSON.stringify({ text }), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
