import { Sparkles, Shield, ThumbsUp } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  comfortScore?: number;
};

export function SmartCheckoutSummary({ title, subtitle, comfortScore = 86 }: Props) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-card p-4 shadow-glow">
      <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Análise IA JAQTRYP
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Stat icon={ThumbsUp} label="Conforto" value={`${comfortScore}/100`} />
        <Stat icon={Shield} label="JAQ Shield" value="Ativo" />
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <Icon className="h-4 w-4 text-primary" />
      <div className="flex-1">
        <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
