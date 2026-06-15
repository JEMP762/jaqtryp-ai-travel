import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { convert, fmt } from "@/lib/fx";
import { getFxRate } from "@/lib/fx.functions";

type Props = {
  amount: number | string;
  currency: string;
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  className?: string;
};

export function PriceWithBrl({ amount, currency, size = "lg", align = "right", className }: Props) {
  const n = typeof amount === "string" ? Number(amount) : amount;
  const cur = (currency || "EUR").toUpperCase();
  const isBrl = cur === "BRL";

  const fxFn = useServerFn(getFxRate);
  const fxQuery = useQuery({
    queryKey: ["fx", cur, "BRL"],
    queryFn: () => fxFn({ data: { base: cur, quote: "BRL" } }),
    enabled: !isBrl && Number.isFinite(n),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  const rate = fxQuery.data?.rate || 0;
  const inBrl = rate > 0 ? convert(n, rate) : 0;

  const sizeCls =
    size === "lg" ? "text-2xl font-bold text-primary" : size === "md" ? "text-base font-semibold" : "text-sm font-semibold";
  const alignCls = align === "right" ? "text-right" : "text-left";

  return (
    <div className={`${alignCls} ${className || ""}`}>
      <div className={sizeCls}>{fmt(n, cur)}</div>
      {!isBrl && rate > 0 && (
        <div className="text-xs text-muted-foreground">≈ {fmt(inBrl, "BRL")}</div>
      )}
    </div>
  );
}
