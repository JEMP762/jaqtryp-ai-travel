import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = 'sandbox' | 'live';

// BYOK: usamos a chave publicável LIVE do Stripe do usuário diretamente.
const PUBLISHABLE_KEY = "pk_live_51RfNJGF2249riykhhCZca2wgglQAYyrwfFjfs2t367MpMKXFS6lSGNNGOG5ufu56yb6wjJZUKswyhgwfS21Mn1HK006d5149YG";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(PUBLISHABLE_KEY);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return PUBLISHABLE_KEY.startsWith("pk_live_") ? "live" : "sandbox";
}
