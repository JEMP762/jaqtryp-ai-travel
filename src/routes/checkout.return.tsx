import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border border-primary/40 bg-gradient-card p-8 text-center shadow-glow">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Pagamento concluído!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session_id
            ? "Sua assinatura foi ativada. Você já pode usar todos os recursos."
            : "Obrigado!"}
        </p>
        <Button asChild className="mt-6 w-full bg-gradient-primary shadow-glow">
          <Link to="/dashboard">Ir para o dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
