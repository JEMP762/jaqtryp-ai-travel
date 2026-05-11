import { createFileRoute } from "@tanstack/react-router";
import { Plane, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/flights")({
  component: FlightsPage,
});

function FlightsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          <Plane className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Voos</h1>
          <p className="text-sm text-muted-foreground">Busca de voos com IA</p>
        </div>
      </div>
      <div className="rounded-2xl border border-primary/30 bg-gradient-card p-10 text-center shadow-glow">
        <Sparkles className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Em breve</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          A busca de voos será habilitada assim que conectarmos a API da Amadeus (ou equivalente).
          Enquanto isso, use o Assistente IA para pedir comparações e dicas de passagens.
        </p>
      </div>
    </div>
  );
}
