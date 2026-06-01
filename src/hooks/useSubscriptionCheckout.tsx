import { useState, useCallback, useMemo } from "react";
import { StripeSubscriptionCheckout } from "@/components/StripeSubscriptionCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Opts {
  priceId: string;
  returnUrl?: string;
}

export function useSubscriptionCheckout() {
  const [opts, setOpts] = useState<Opts | null>(null);

  const openCheckout = useCallback((o: Opts) => setOpts(o), []);
  const closeCheckout = useCallback(() => setOpts(null), []);

  const checkoutDialog = useMemo(() => (
    <Dialog open={!!opts} onOpenChange={(o) => !o && closeCheckout()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar assinatura</DialogTitle>
        </DialogHeader>
        {opts && (
          <StripeSubscriptionCheckout
            priceId={opts.priceId}
            returnUrl={opts.returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        )}
      </DialogContent>
    </Dialog>
  ), [opts, closeCheckout]);

  return { openCheckout, closeCheckout, checkoutDialog, isOpen: !!opts };
}
