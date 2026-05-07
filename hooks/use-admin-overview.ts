import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type AdminOverview = {
  thisMonthSalesJpy: number;
  thisMonthOrderCount: number;
  totalGoalJpy: number;
  goalProgressPct: number;
  projectedMonthEndJpy: number;

  followRequiredCount: number;
  newCustomerRegisteredCount: number;   // 登録ベース（system ログ）
  newCustomerFirstOrderCount: number;   // 初回受注ベース（経営指標）
  newRangerThisMonthCount: number;      // 今月加入レンジャー

  totalCustomers: number;
  totalRangers: number;

  totalCommissionPending: number;
  totalCommissionPaid: number;

  pendingApprovalCount: number;

  rangers: Array<{
    ranger_id: string;
    display_name: string;
    avatar_url: string | null;
    current_rank: string;
    sales_jpy: number;
    order_count: number;
    ranger_number: number;
    is_active_this_month: boolean;
  }>;
};

export function useAdminOverview() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [rankingRes, commissionsRes, rangersRes, customersRes, allOrdersRes, pendingRes, allRangersRes] = await Promise.all([
        supabase
          .from('v_ranking_this_month')
          .select('ranger_id, sales_jpy, order_count')
          .order('sales_jpy', { ascending: false }),
        supabase.from('commissions').select('ranger_amount_jpy, status'),
        supabase.from('rangers').select('monthly_goal_jpy, joined_at'),
        supabase.from('customers').select('id, last_ordered_at, created_at'),
        supabase
          .from('orders')
          .select('customer_id, ordered_at')
          .neq('status', 'cancelled')
          .order('ordered_at', { ascending: true }),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        // 全レンジャー（受注ゼロ含む）
        supabase
          .from('rangers')
          .select(
            `id, ranger_code, current_rank,
             profiles!inner(display_name, avatar_url)`
          ),
      ]);

      if (!mounted) return;

      const rankingRows = (rankingRes.data ?? []) as Array<{
        ranger_id: string;
        sales_jpy: number | string;
        order_count: number | string;
      }>;

      const thisMonthSalesJpy = rankingRows.reduce((s, r) => s + Number(r.sales_jpy ?? 0), 0);
      const thisMonthOrderCount = rankingRows.reduce((s, r) => s + Number(r.order_count ?? 0), 0);

      const salesMap = new Map<string, { sales_jpy: number; order_count: number }>();
      for (const r of rankingRows) {
        salesMap.set(r.ranger_id, {
          sales_jpy: Number(r.sales_jpy ?? 0),
          order_count: Number(r.order_count ?? 0),
        });
      }

      const goals = (rangersRes.data ?? []) as Array<{ monthly_goal_jpy: number | string; joined_at: string | null }>;
      const totalGoalJpy = goals.reduce((s, g) => s + Number(g.monthly_goal_jpy ?? 0), 0);
      const goalProgressPct = totalGoalJpy > 0 ? Math.min(1, thisMonthSalesJpy / totalGoalJpy) : 0;

      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysPassed = now.getDate();
      const projectedMonthEndJpy =
        daysPassed > 0 ? Math.round((thisMonthSalesJpy / daysPassed) * daysInMonth) : 0;

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

      const customers = (customersRes.data ?? []) as Array<{
        id: string;
        last_ordered_at: string | null;
        created_at: string | null;
      }>;
      const followRequiredCount = customers.filter(
        (c) => !c.last_ordered_at || new Date(c.last_ordered_at) < thirtyDaysAgo
      ).length;
      const newCustomerRegisteredCount = customers.filter(
        (c) => c.created_at && new Date(c.created_at) >= monthStart
      ).length;

      // 初回受注ベース：顧客ごとの最古 ordered_at が今月
      const orders = (allOrdersRes.data ?? []) as Array<{ customer_id: string; ordered_at: string }>;
      const firstOrderByCustomer = new Map<string, Date>();
      for (const o of orders) {
        if (!firstOrderByCustomer.has(o.customer_id)) {
          firstOrderByCustomer.set(o.customer_id, new Date(o.ordered_at));
        }
      }
      const newCustomerFirstOrderCount = Array.from(firstOrderByCustomer.values()).filter(
        (d) => d >= monthStart
      ).length;

      const newRangerThisMonthCount = goals.filter(
        (g) => g.joined_at && new Date(g.joined_at) >= monthStart
      ).length;

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

      const pendingApprovalCount = Number(pendingRes.count ?? 0);

      // 全レンジャー一覧を構築（受注ゼロ含む）
      const allRangerRows = (allRangersRes.data ?? []) as unknown as Array<{
        id: string;
        ranger_code: string | null;
        current_rank: string | null;
        profiles:
          | { display_name: string | null; avatar_url: string | null }
          | Array<{ display_name: string | null; avatar_url: string | null }>
          | null;
      }>;
      const allRangers = allRangerRows
        .map((r) => {
          const code = r.ranger_code ?? '';
          const numMatch = code.match(/(\d+)/);
          const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          const sales = salesMap.get(r.id);
          return {
            ranger_id: r.id,
            display_name: profile?.display_name ?? '（未設定）',
            avatar_url: profile?.avatar_url ?? null,
            current_rank: r.current_rank ?? 'BRONZE',
            sales_jpy: sales?.sales_jpy ?? 0,
            order_count: sales?.order_count ?? 0,
            ranger_number: numMatch ? Number(numMatch[1]) : 0,
            is_active_this_month: !!sales && sales.sales_jpy > 0,
          };
        })
        .sort((a, b) => {
          if (b.sales_jpy !== a.sales_jpy) return b.sales_jpy - a.sales_jpy;
          return a.ranger_number - b.ranger_number;
        });

      setOverview({
        thisMonthSalesJpy,
        thisMonthOrderCount,
        totalGoalJpy,
        goalProgressPct,
        projectedMonthEndJpy,
        followRequiredCount,
        newCustomerRegisteredCount,
        newCustomerFirstOrderCount,
        newRangerThisMonthCount,
        totalCustomers: customers.length,
        totalRangers: allRangers.length,
        totalCommissionPending,
        totalCommissionPaid,
        pendingApprovalCount,
        rangers: allRangers,
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { overview, loading };
}
