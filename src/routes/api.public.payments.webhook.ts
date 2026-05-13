import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DUFFEL_BASE = "https://api.duffel.com";

async function duffel(path: string, init: RequestInit = {}) {
  const key = process.env.DUFFEL_API_KEY;
  if (!key) throw new Error("DUFFEL_API_KEY ausente");
  const res = await fetch(`${DUFFEL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const j: any = await res.json().catch(() => null);
  if (!res.ok) throw new Error(j?.errors?.[0]?.message || `Duffel ${res.status}`);
  return j;
}

function verifySig(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    const a = Buffer.from(signature.replace(/^sha256=/, ""), "utf8");
    const b = Buffer.from(expected, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function fulfillPending(pendingId: string, sessionId: string) {
  const { data: pending, error } = await supabaseAdmin
    .from("pending_flight_bookings")
    .select("*")
    .eq("id", pendingId)
    .maybeSingle();
  if (error || !pending) throw new Error("Reserva pendente não encontrada");
  if (pending.duffel_order_id) return { already: true };

  // Fetch offer
  const offerRes = await duffel(`/air/offers/${pending.offer_id}?return_available_services=false`);
  const offer = offerRes?.data;
  if (!offer) throw new Error("Oferta expirou — pagamento será reembolsado");

  const orderRes = await duffel("/air/orders", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "instant",
        selected_offers: [pending.offer_id],
        passengers: pending.passengers,
        payments: [{ type: "balance", amount: offer.total_amount, currency: offer.total_currency }],
      },
    }),
  });
  const order = orderRes.data;

  await supabaseAdmin.from("flight_orders").insert({
    user_id: pending.user_id,
    duffel_order_id: order.id,
    booking_reference: order.booking_reference,
    total_amount: order.total_amount,
    total_currency: order.total_currency,
    passengers: order.passengers || [],
    slices: order.slices || [],
    status: "confirmed",
    raw: order,
  });

  await supabaseAdmin.from("booking_commissions").insert({
    user_id: pending.user_id,
    order_kind: "flight",
    order_id: order.id,
    original_amount: pending.original_amount,
    markup_amount: (pending.breakdown as any)?.markup ?? 0,
    service_fee_amount: (pending.breakdown as any)?.serviceFee ?? 0,
    final_amount: pending.final_amount,
    currency: pending.final_currency,
    net_profit: (pending.breakdown as any)?.netProfit ?? 0,
    upsells: [],
    provider: "stripe",
    payment_session_id: sessionId,
  });

  await supabaseAdmin
    .from("pending_flight_bookings")
    .update({ payment_status: "paid", duffel_order_id: order.id })
    .eq("id", pendingId);

  return { ok: true, booking_reference: order.booking_reference };
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = url.searchParams.get("env") || "sandbox";
        const secret =
          env === "live"
            ? process.env.PAYMENTS_WEBHOOK_SECRET
            : process.env.PAYMENTS_SANDBOX_WEBHOOK_SECRET || process.env.PAYMENTS_WEBHOOK_SECRET;

        const body = await request.text();
        const sig =
          request.headers.get("x-lovable-signature") ||
          request.headers.get("lovable-signature") ||
          request.headers.get("x-webhook-signature");

        if (secret && !verifySig(body, sig, secret)) {
          console.warn("[payments/webhook] invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const type: string = event?.type || event?.event || "";
        const data = event?.data?.object || event?.data || event;

        try {
          if (type === "transaction.completed" || type === "checkout.session.completed") {
            const sessionId = data?.session_id || data?.id;
            const pendingId =
              data?.metadata?.pending_id ||
              event?.metadata?.pending_id ||
              null;
            if (pendingId) await fulfillPending(pendingId, sessionId);
          } else if (type === "transaction.payment_failed") {
            const pendingId = data?.metadata?.pending_id;
            if (pendingId)
              await supabaseAdmin
                .from("pending_flight_bookings")
                .update({ payment_status: "failed", error: data?.failure_message || "payment_failed" })
                .eq("id", pendingId);
          }
        } catch (e: any) {
          console.error("[payments/webhook] fulfill error", e?.message || e);
          return new Response(JSON.stringify({ ok: false, error: e?.message }), { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
