import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyCommissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("booking_commissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return { rows: data || [] };
  });

export const adminFinancialSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Acesso negado");

    const { data, error } = await supabase
      .from("booking_commissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;

    const rows = data || [];
    const totalRevenue = rows.reduce((s, r: any) => s + Number(r.final_amount || 0), 0);
    const totalCommission = rows.reduce(
      (s, r: any) => s + Number(r.markup_amount || 0) + Number(r.service_fee_amount || 0),
      0,
    );
    const netProfit = rows.reduce((s, r: any) => s + Number(r.net_profit || 0), 0);
    const avgTicket = rows.length ? totalRevenue / rows.length : 0;
    const upsellsSold = rows.reduce(
      (s, r: any) => s + (Array.isArray(r.upsells) ? r.upsells.length : 0),
      0,
    );

    // Daily revenue (last 30d)
    const byDay = new Map<string, number>();
    for (const r of rows as any[]) {
      const day = String(r.created_at).slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + Number(r.final_amount || 0));
    }
    const series = Array.from(byDay.entries())
      .map(([date, value]) => ({ date, value: +value.toFixed(2) }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return {
      kpis: {
        bookings: rows.length,
        totalRevenue: +totalRevenue.toFixed(2),
        totalCommission: +totalCommission.toFixed(2),
        netProfit: +netProfit.toFixed(2),
        avgTicket: +avgTicket.toFixed(2),
        upsellsSold,
      },
      series,
      rows: rows.slice(0, 50),
    };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });
