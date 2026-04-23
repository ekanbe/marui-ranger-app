import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type HomeKpis = {
  monthSalesJpy: number;
  prevMonthSalesJpy: number;
  monthGrowthPct: number;
  estimatedMarginJpy: number;
  estimatedMarginDeltaJpy: number;
  cumulativeMarginJpy: number;
  newOrdersCount: number;
  newOrdersDelta: number;
  monthlyGoalJpy: number;
  goalProgressPct: number;
  remainingToGoalJpy: number;
};

type SummaryRow = {
  month: string | null;
  sales_jpy: number | null;
  ranger_commission_jpy: number | null;
  order_count: number | null;
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useHomeKpis(session: Session | null) {
  const [kpis, setKpis] = useState<HomeKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setKpis(null);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      const [summary, goal] = await Promise.all([
        supabase
          .from('v_ranger_monthly_summary')
          .select('month, sales_jpy, ranger_commission_jpy, order_count')
          .eq('ranger_id', session.user.id)
          .order('month', { ascending: false }),
        supabase
          .from('rangers')
          .select('monthly_goal_jpy')
          .eq('id', session.user.id)
          .maybeSingle(),
      ]);

      if (!mounted) return;
      if (summary.error) console.warn('[useHomeKpis summary]', summary.error.message);

      const now = new Date();
      const thisKey = monthKey(now);
      const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastKey = monthKey(lastDate);

      const rows = (summary.data ?? []) as SummaryRow[];
      const t = rows.find((r) => (r.month ?? '').startsWith(thisKey));
      const l = rows.find((r) => (r.month ?? '').startsWith(lastKey));

      const monthSales = Number(t?.sales_jpy ?? 0);
      const prevSales = Number(l?.sales_jpy ?? 0);
      const monthMargin = Number(t?.ranger_commission_jpy ?? 0);
      const prevMargin = Number(l?.ranger_commission_jpy ?? 0);
      const cumulativeMargin = rows.reduce((s, r) => s + Number(r.ranger_commission_jpy ?? 0), 0);
      const monthlyGoal = Number((goal.data as { monthly_goal_jpy?: number } | null)?.monthly_goal_jpy ?? 0);

      setKpis({
        monthSalesJpy: monthSales,
        prevMonthSalesJpy: prevSales,
        monthGrowthPct: prevSales > 0 ? (monthSales - prevSales) / prevSales : 0,
        estimatedMarginJpy: monthMargin,
        estimatedMarginDeltaJpy: monthMargin - prevMargin,
        cumulativeMarginJpy: cumulativeMargin,
        newOrdersCount: Number(t?.order_count ?? 0),
        newOrdersDelta: Number(t?.order_count ?? 0) - Number(l?.order_count ?? 0),
        monthlyGoalJpy: monthlyGoal,
        goalProgressPct: monthlyGoal > 0 ? Math.min(1, monthSales / monthlyGoal) : 0,
        remainingToGoalJpy: Math.max(0, monthlyGoal - monthSales),
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  return { kpis, loading };
}
