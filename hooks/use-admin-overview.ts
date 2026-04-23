import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type AdminOverview = {
  totalCustomers: number;
  totalRangers: number;
  thisMonthSalesJpy: number;
  thisMonthOrderCount: number;
  totalCommissionPending: number;
  totalCommissionPaid: number;
  rangers: Array<{
    ranger_id: string;
    display_name: string;
    current_rank: string;
    sales_jpy: number;
  }>;
};

export function useAdminOverview() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [customersRes, rankingRes, commissionsRes] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase
          .from('v_ranking_this_month')
          .select('ranger_id, display_name, current_rank, sales_jpy, order_count')
          .order('sales_jpy', { ascending: false }),
        supabase.from('commissions').select('ranger_amount_jpy, status'),
      ]);

      if (!mounted) return;

      const rankingRows = (rankingRes.data ?? []) as Array<{
        ranger_id: string;
        display_name: string;
        current_rank: string;
        sales_jpy: number | string;
        order_count: number | string;
      }>;

      const totalCustomers = customersRes.count ?? 0;
      const totalRangers = rankingRows.length;
      const thisMonthSalesJpy = rankingRows.reduce((s, r) => s + Number(r.sales_jpy ?? 0), 0);
      const thisMonthOrderCount = rankingRows.reduce((s, r) => s + Number(r.order_count ?? 0), 0);

      const commissions = (commissionsRes.data ?? []) as Array<{
        ranger_amount_jpy: number | string;
        status: string;
      }>;
      const pending = commissions
        .filter((c) => c.status !== 'paid')
        .reduce((s, c) => s + Number(c.ranger_amount_jpy ?? 0), 0);
      const paid = commissions
        .filter((c) => c.status === 'paid')
        .reduce((s, c) => s + Number(c.ranger_amount_jpy ?? 0), 0);

      setOverview({
        totalCustomers,
        totalRangers,
        thisMonthSalesJpy,
        thisMonthOrderCount,
        totalCommissionPending: pending,
        totalCommissionPaid: paid,
        rangers: rankingRows.map((r) => ({
          ranger_id: r.ranger_id,
          display_name: r.display_name,
          current_rank: r.current_rank,
          sales_jpy: Number(r.sales_jpy ?? 0),
        })),
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { overview, loading };
}
