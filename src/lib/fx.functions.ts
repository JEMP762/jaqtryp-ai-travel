import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const memCache = new Map<string, { rate: number; ts: number }>();

async function fetchFromProviders(base: string, quote: string): Promise<number> {
  const tries = [
    `https://open.er-api.com/v6/latest/${base}`,
    `https://api.exchangerate.host/latest?base=${base}&symbols=${quote}`,
  ];
  for (const url of tries) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const j: any = await res.json();
      const rate = j?.rates?.[quote];
      if (typeof rate === "number" && rate > 0) return rate;
    } catch {
      // try next
    }
  }
  // Static fallback (approximate Mai/2026)
  if (base === "EUR" && quote === "BRL") return 6.2;
  if (base === "BRL" && quote === "EUR") return 1 / 6.2;
  if (base === quote) return 1;
  throw new Error(`FX indisponível para ${base}/${quote}`);
}

const Schema = z.object({
  base: z.string().length(3).default("EUR"),
  quote: z.string().length(3).default("BRL"),
});

export const getFxRate = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => Schema.parse(i ?? {}))
  .handler(async ({ data }) => {
    const base = data.base.toUpperCase();
    const quote = data.quote.toUpperCase();
    const key = `${base}:${quote}`;
    const cached = memCache.get(key);
    const now = Date.now();
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return { base, quote, rate: cached.rate, fetched_at: new Date(cached.ts).toISOString(), cached: true };
    }
    try {
      const rate = await fetchFromProviders(base, quote);
      memCache.set(key, { rate, ts: now });
      // Best-effort persist to DB cache
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin
          .from("fx_rates")
          .upsert({ base_currency: base, quote_currency: quote, rate, fetched_at: new Date().toISOString() }, { onConflict: "base_currency,quote_currency" });
      } catch {
        /* ignore */
      }
      return { base, quote, rate, fetched_at: new Date(now).toISOString(), cached: false };
    } catch (e: any) {
      return { base, quote, rate: 0, fetched_at: new Date(now).toISOString(), cached: false, error: e?.message || "fx error" };
    }
  });
