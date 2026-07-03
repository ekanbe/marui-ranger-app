import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type RangerDetail = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string | null;
  ranger_code: string;
  ranger_number: number;
  joined_at: string | null;
  monthly_goal_jpy: number;
  current_rank: string;

  // 今月実績
  thisMonthSalesJpy: number;
  thisMonthOrderCount: number;
  goalProgressPct: number;

  // 累計実績
  totalSalesJpy: number;
  totalOrderCount: number;
  totalCommissionPaid: number;
  totalCommissionPending: number;

  // 担当顧客
  customers: Array<{
    id: string;
    name: string;
    branch_name: string | null;
    image_url: string | null;
    last_ordered_at: string | null;
    status: string;
  }>;
};

type NestedRanger = {
  id: string;
  ranger_code: string;
  joined_at: string | null;
  monthly_goal_jpy: number | string;
  current_rank: string;
  profiles: { display_name: string | null; email: string | null; avatar_url: string | null } | null;
};

export function useRangerDetail(rangerId: string | undefined) {
  const [detail, setDetail] = useState<RangerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!rangerId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const [rangerRes, numberRes, summaryRes, commissionsRes, customersRes, orderCountRes] = await Promise.all([
        supabase
          .from('rangers')
          .select('id, ranger_code, joined_at, monthly_goal_jpy, current_rank, profiles!inner(display_name, email, avatar_url)')
          .eq('id', rangerId)
          .maybeSingle(),
        supabase
          .from('v_ranger_numbers')
          .select('ranger_number')
          .eq('ranger_id', rangerId)
          .maybeSingle(),
        supabase
          .from('v_ranger_monthly_summary')
          .select('month, sales_jpy, order_count, ranger_commission_jpy')
          .eq('ranger_id', rangerId)
          .order('month', { ascending: false }),
        supabase
          .from('commissions')
          .select('ranger_amount_jpy, status')
          .eq('ranger_id', rangerId),
        supabase
          .from('customers')
          .select('id, name, branch_name, image_url, last_ordered_at, status')
          .eq('assigned_ranger_id', rangerId)
          .order('last_ordered_at', { ascending: false, nullsFirst: false }),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('ranger_id', rangerId)
          .neq('status', 'cancelled'),
      ]);

      if (!mounted) return;

      // 6 クエリの error を集約（従来はチェック自体が無く、失敗が 0 円表示に化けていた）
      const errors = [
        rangerRes.error?.message && `ranger: ${rangerRes.error.message}`,
        numberRes.error?.message && `number: ${numberRes.error.message}`,
        summaryRes.error?.message && `summary: ${summaryRes.error.message}`,
        commissionsRes.error?.message && `commissions: ${commissionsRes.error.message}`,
        customersRes.error?.message && `customers: ${customersRes.error.message}`,
        orderCountRes.error?.message && `orderCount: ${orderCountRes.error.message}`,
      ].filter(Boolean) as string[];
      if (errors.length > 0) {
        console.warn('[useRangerDetail]', errors.join(' / '));
        setError(errors.join(' / '));
        setLoading(false);
        return;
      }

      const r = rangerRes.data as unknown as NestedRanger | null;
      if (!r) {
        setDetail(null);
        setLoading(false);
        return;
      }

      const summary = (summaryRes.data ?? []) as Array<{
        month: string | null;
        sales_jpy: number | string | null;
        order_count: number | string | null;
        ranger_commission_jpy: number | string | null;
      }>;
      const now = new Date();
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const thisMonthRow = summary.find((s) => (s.month ?? '').startsWith(thisMonthKey));

      const thisMonthSalesJpy = Number(thisMonthRow?.sales_jpy ?? 0);
      const thisMonthOrderCount = Number(thisMonthRow?.order_count ?? 0);
      const monthlyGoalJpy = Number(r.monthly_goal_jpy ?? 0);
      const goalProgressPct = monthlyGoalJpy > 0 ? Math.min(1, thisMonthSalesJpy / monthlyGoalJpy) : 0;

      const totalSalesJpy = summary.reduce((s, x) => s + Number(x.sales_jpy ?? 0), 0);
      const totalOrderCount = Number(orderCountRes.count ?? 0);

      const commissions = (commissionsRes.data ?? []) as Array<{
        ranger_amount_jpy: number | string;
        status: string;
      }>;
      const totalCommissionPending = commissions
        .filter((c) => c.status !== 'paid')
        .reduce((s, c) => s + Number(c.ranger_amount_jpy ?? 0), 0);
      const totalCommissionPaid = commissions
        .filter((c) => c.status === 'paid')
        .reduce((s, c) => s + Number(c.ranger_amount_jpy ?? 0), 0);

      const customers = (customersRes.data ?? []) as Array<{
        id: string;
        name: string;
        branch_name: string | null;
        image_url: string | null;
        last_ordered_at: string | null;
        status: string;
      }>;

      const numberData = numberRes.data as { ranger_number: number | string } | null;

      setDetail({
        id: r.id,
        display_name: r.profiles?.display_name ?? '-',
        avatar_url: r.profiles?.avatar_url ?? null,
        email: r.profiles?.email ?? null,
        ranger_code: r.ranger_code,
        ranger_number: Number(numberData?.ranger_number ?? 0),
        joined_at: r.joined_at,
        monthly_goal_jpy: monthlyGoalJpy,
        current_rank: r.current_rank,
        thisMonthSalesJpy,
        thisMonthOrderCount,
        goalProgressPct,
        totalSalesJpy,
        totalOrderCount,
        totalCommissionPending,
        totalCommissionPaid,
        customers,
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [rangerId, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { detail, loading, error, reload };
}
