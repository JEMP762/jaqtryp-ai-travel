import * as React from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createSubscriptionCheckout } from "@/lib/subscription.functions";
import { AlertCircle } from "lucide-react";

interface Props {
  priceId: string;
  returnUrl: string;
}

export function StripeSubscriptionCheckout({ priceId, returnUrl }: Props) {
  const [error, setError] = React.useState<string | null>(null);

  const fetchClientSecret = async (): Promise<string> => {
    try {
      const result = await createSubscriptionCheckout({
        data: { priceId, returnUrl, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      if (!result.clientSecret) throw new Error("Stripe não retornou client secret");
      return result.clientSecret;
    } catch (e: any) {
      const msg = e?.message || "Falha ao iniciar checkout";
      setError(msg);
      throw e;
    }
  };

  if (error) {
    const isMissingPrice = /no such price|resource_missing/i.test(error);
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">Não foi possível abrir o checkout</p>
            <p className="mt-1 text-muted-foreground">{error}</p>
            {isMissingPrice && (
              <p className="mt-3 text-muted-foreground">
                Os preços configurados são do seu Stripe <strong>live</strong>. O preview do Lovable roda em
                modo <strong>sandbox</strong>, por isso o Stripe não encontra esses preços aqui.
                Publique o app e teste no site publicado para usar os preços reais.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout" className="min-h-[600px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
