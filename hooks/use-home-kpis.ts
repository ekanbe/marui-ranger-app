import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { PROGRAM_START_MONTH } from '@/lib/program';
import { supabase } from '@/lib/supabase';

export type HomeKpis = {
  monthSalesJpy: number;
  prevMonthSalesJpy: number;
  monthGrowthPct: number;
  estimatedMarginJpy: number;
  estimatedMarginDeltaJpy: number;
  /** 全期間のマージン合計。paid（支払済）を「含む」ので、支払済額と足すと二重計上になる */
  cumulativeMarginJpy: number;
  /** 全期間の未払いマージン合計（cumulativeMarginJpy − 支払済）。支払済額と足し合わせて使うのはこちら */
  cumulativeUnpaidMarginJpy: number;
  newOrdersCount: number;
  newOrdersDelta: number;
  monthlyGoalJpy: number;
  goalProgressPct: number;
  remainingToGoalJpy: number;
  monthlyTrend: { month: string; sales: number }[];
  marginTrend: { month: string; margin: number }[];
};

type SummaryRow = {
  month: string | null;
  sales_jpy: number | null;
  ranger_commission_jpy: number | null;
  paid_commission_jpy: number | null;
  order_count: number | null;
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useHomeKpis(session: Session | null) {
  const [kpis, setKpis] = useState<HomeKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // session オブジェクト自体を依存にすると TOKEN_REFRESHED のたびに再フェッチされるため user.id で見る
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setKpis(null);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const [summary, goal] = await Promise.all([
        supabase
          .from('v_ranger_monthly_summary')
          .select('month, sales_jpy, ranger_commission_jpy, paid_commission_jpy, order_count')
          .eq('ranger_id', userId)
          .order('month', { ascending: false }),
        supabase
          .from('rangers')
          .select('monthly_goal_jpy')
          .eq('id', userId)
          .maybeSingle(),
      ]);

      if (!mounted) return;
      if (summary.error) console.warn('[useHomeKpis summary]', summary.error.message);
      if (goal.error) console.warn('[useHomeKpis goal]', goal.error.message);
      if (summary.error || goal.error) {
        setError(summary.error?.message ?? goal.error?.message ?? 'unknown error');
        setLoading(false);
        return;
      }

      const now = new Date();
      const thisKey = monthKey(now);
      const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastKey = monthKey(lastDate);

      const rows = (summary.data ?? []) as SummaryRow[];

      // レンジャー制度は2026年4月開始。それ以前のVIPS取込み分(1〜3月)は
      // 推移・累計の集計から除外する（month='2026-04-01'形式との文字列比較）
      const programRows = rows.filter((r) => (r.month ?? '') >= PROGRAM_START_MONTH);

      const t = rows.find((r) => (r.month ?? '').startsWith(thisKey));
      const l = rows.find((r) => (r.month ?? '').startsWith(lastKey));

      const monthSales = Number(t?.sales_jpy ?? 0);
      const prevSales = Number(l?.sales_jpy ?? 0);
      const monthMargin = Number(t?.ranger_commission_jpy ?? 0);
      const prevMargin = Number(l?.ranger_commission_jpy ?? 0);
      // ranger_commission_jpy は pending/confirmed/paid すべての合計（= paid を含む）
      const cumulativeMargin = programRows.reduce((s, r) => s + Number(r.ranger_commission_jpy ?? 0), 0);
      const cumulativePaid = programRows.reduce((s, r) => s + Number(r.paid_commission_jpy ?? 0), 0);
      const monthlyGoal = Number((goal.data as { monthly_goal_jpy?: number } | null)?.monthly_goal_jpy ?? 0);

      // 制度開始以降・直近6ヶ月のトレンド（古→新）
      const recentRows = programRows.filter((r) => r.month).slice(0, 6).reverse();
      const monthlyTrend = recentRows.map((r) => {
        const d = new Date(r.month as string);
        return {
          month: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`,
          sales: Number(r.sales_jpy ?? 0),
        };
      });
      const marginTrend = recentRows.map((r) => {
        const d = new Date(r.month as string);
        return {
          month: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`,
          margin: Number(r.ranger_commission_jpy ?? 0),
        };
      });

      setKpis({
        monthSalesJpy: monthSales,
        prevMonthSalesJpy: prevSales,
        monthGrowthPct: prevSales > 0 ? (monthSales - prevSales) / prevSales : 0,
        estimatedMarginJpy: monthMargin,
        estimatedMarginDeltaJpy: monthMargin - prevMargin,
        cumulativeMarginJpy: cumulativeMargin,
        cumulativeUnpaidMarginJpy: Math.max(0, cumulativeMargin - cumulativePaid),
        newOrdersCount: Number(t?.order_count ?? 0),
        newOrdersDelta: Number(t?.order_count ?? 0) - Number(l?.order_count ?? 0),
        monthlyGoalJpy: monthlyGoal,
        goalProgressPct: monthlyGoal > 0 ? Math.min(1, monthSales / monthlyGoal) : 0,
        remainingToGoalJpy: Math.max(0, monthlyGoal - monthSales),
        monthlyTrend,
        marginTrend,
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [userId, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { kpis, loading, error, reload };
}
