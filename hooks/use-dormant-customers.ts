import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type DormancyLevel = 'never' | 'active' | 'warning' | 'danger' | 'critical';

export type DormantCustomer = {
  customer_id: string;
  name: string;
  branch_name: string | null;
  assigned_ranger_id: string | null;
  acquired_by_ranger_id: string | null;
  sales_phase: string | null;
  last_ordered_at: string | null;
  days_since_last_order: number | null;
  dormancy_level: DormancyLevel;
};

export type DormancySummary = {
  warning: number;   // 30〜60日（黄）
  danger: number;    // 60〜90日（橙）
  critical: number;  // 90日以上（赤）
  total: number;     // 警告以上の合計
};

type Scope = { rangerId: string | null; isAdmin: boolean };

/**
 * 担当範囲の dormant 顧客一覧を取得。
 * - ranger: assigned_ranger_id が自分のもの
 * - admin : 全顧客
 *
 * `active` と `never` は警告対象外なので含めない（必要に応じて includeAll で全件）
 */
export function useDormantCustomers(
  scope: Scope,
  options: { includeAll?: boolean } = {},
) {
  const [customers, setCustomers] = useState<DormantCustomer[]>([]);
  const [summary, setSummary] = useState<DormancySummary>({
    warning: 0,
    danger: 0,
    critical: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { rangerId, isAdmin } = scope;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('v_customer_last_order')
        .select(
          'customer_id, name, branch_name, assigned_ranger_id, acquired_by_ranger_id, sales_phase, last_ordered_at, days_since_last_order, dormancy_level',
        )
        .order('days_since_last_order', { ascending: false, nullsFirst: false });

      if (!isAdmin && rangerId) {
        query = query.eq('assigned_ranger_id', rangerId);
      }

      if (!options.includeAll) {
        query = query.in('dormancy_level', ['warning', 'danger', 'critical']);
      }

      const { data, error: qerr } = await query;
      if (qerr) throw qerr;
      const rows = (data ?? []) as DormantCustomer[];
      setCustomers(rows);

      const sum: DormancySummary = { warning: 0, danger: 0, critical: 0, total: 0 };
      for (const r of rows) {
        if (r.dormancy_level === 'warning') sum.warning++;
        else if (r.dormancy_level === 'danger') sum.danger++;
        else if (r.dormancy_level === 'critical') sum.critical++;
      }
      sum.total = sum.warning + sum.danger + sum.critical;
      setSummary(sum);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [rangerId, isAdmin, options.includeAll]);

  useEffect(() => {
    load();
  }, [load]);

  return { customers, summary, loading, error, reload: load };
}
