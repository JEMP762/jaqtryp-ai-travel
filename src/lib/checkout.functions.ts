import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { applyPricing, DEFAULT_COMMISSION_SETTINGS, type CommissionSettings } from "./pricing";

const STRIPE_GATEWAY = "https://connector-gateway.lovable.dev/stripe/v1";

function getStripeAuth() {
  const lov = process.env.LOVABLE_API_KEY;
  const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SANDBOX_API_KEY;
  if (!lov) throw new Error("LOVABLE_API_KEY ausente");
  if (!stripeKey) throw new Error("Pagamentos não configurados (STRIPE_API_KEY)");
  return { lov, stripeKey };
}

function form(obj: Record<string, string | number>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) p.append(k, String(v));
  return p.toString();
}

async function stripeFetch(path: string, body: string) {
  const { lov, stripeKey } = getStripeAuth();
  const res = await fetch(`${STRIPE_GATEWAY}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lov}`,
      "X-Connection-Api-Key": stripeKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const j: any = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || `Stripe ${res.status}`);
  return j;
}

const PassengerSchema = z.object({
  id: z.string(),
  given_name: z.string().min(1),
  family_name: z.string().min(1),
  born_on: z.string(),
  gender: z.enum(["m", "f"]),
  title: z.enum(["mr", "ms", "mrs", "miss", "dr"]),
  email: z.string().email(),
  phone_number: z.string().min(5),
});

const CheckoutSchema = z.object({
  offer_id: z.string(),
  original_amount: z.coerce.number().positive(),
  original_currency: z.string().length(3),
  passengers: z.array(PassengerSchema).min(1),
  origin: z.string().optional(),
  destination: z.string().optional(),
});

export const createFlightCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CheckoutSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Resolve commission settings
    const { data: cs } = await supabase
      .from("commission_settings")
      .select("markup_type, markup_value, service_fee_type, service_fee_value, default_currency, upsells_enabled")
      .limit(1)
      .maybeSingle();
    const settings = (cs as CommissionSettings) || DEFAULT_COMMISSION_SETTINGS;

    // Charge in EUR by default; original currency stays for Duffel.
    const targetCurrency = (settings.default_currency || "EUR").toUpperCase();
    const breakdown = applyPricing(data.original_amount, data.original_currency, settings);

    // Insert pending booking row first
    const { data: pending, error: insErr } = await supabase
      .from("pending_flight_bookings")
      .insert({
        user_id: userId,
        offer_id: data.offer_id,
        passengers: data.passengers,
        original_amount: breakdown.original,
        original_currency: data.original_currency,
        final_amount: breakdown.final,
        final_currency: targetCurrency,
        breakdown: breakdown as any,
      })
      .select("id")
      .single();
    if (insErr || !pending) throw new Error(insErr?.message || "Falha ao registrar reserva");

    const origin = process.env.PUBLIC_APP_URL || "https://project--6d4b0769-d635-4330-aa35-732b66d1a0d8.lovable.app";
    const successUrl = `${origin}/flights?paid=${pending.id}`;
    const cancelUrl = `${origin}/flights?canceled=${pending.id}`;

    const body = form({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      "payment_method_types[0]": "card",
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": targetCurrency.toLowerCase(),
      "line_items[0][price_data][unit_amount]": Math.round(breakdown.final * 100),
      "line_items[0][price_data][product_data][name]":
        `JAQTRYP · Voo ${data.origin || ""} → ${data.destination || ""}`.trim(),
      "metadata[pending_id]": pending.id,
      "metadata[user_id]": userId,
      "metadata[kind]": "flight",
      customer_email: data.passengers[0].email,
    });

    const session = await stripeFetch("/checkout/sessions", body);

    await supabase
      .from("pending_flight_bookings")
      .update({ payment_session_id: session.id })
      .eq("id", pending.id);

    return { url: session.url as string, session_id: session.id as string, pending_id: pending.id };
  });
