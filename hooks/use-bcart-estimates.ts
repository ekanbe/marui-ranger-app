import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type BcartEstimate = {
  id: string;
  bcart_estimate_id: string;
  bcart_estimate_code: string | null;
  bcart_customer_id: string | null;
  bcart_comp_name: string | null;
  customer_name: string | null;
  total_price: number | null;
  final_price: number | null;
  bcart_status: string | null;
  related_order_id: string | null;
  estimated_at: string | null;
  estimate_due: string | null;
  customer_message: string | null;
  admin_message: string | null;
  memo: string | null;
};

export type BcartEstimateSummary = {
  total: number;
  pending: number;       // 新規見積 (related_order_id null & status not cancelled)
  registered: number;    // 受注済 (related_order_id 付き)
  cancelled: number;
};

export function useBcartEstimates() {
  const [rows, setRows] = useState<BcartEstimate[]>([]);
  const [summary, setSummary] = useState<BcartEstimateSummary>({
    total: 0,
    pending: 0,
    registered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qerr } = await supabase
        .from('bcart_estimates')
        .select(
          'id, bcart_estimate_id, bcart_estimate_code, bcart_customer_id, bcart_comp_name, customer_name, total_price, final_price, bcart_status, related_order_id, estimated_at, estimate_due, customer_message, admin_message, memo',
        )
        .order('estimated_at', { ascending: false, nullsFirst: false })
        .limit(200);
      if (qerr) throw qerr;
      const list = (data ?? []) as BcartEstimate[];
      setRows(list);

      const s: BcartEstimateSummary = { total: list.length, pending: 0, registered: 0, cancelled: 0 };
      for (const r of list) {
        if (r.related_order_id) s.registered++;
        else if (r.bcart_status === 'キャンセル') s.cancelled++;
        else s.pending++;
      }
      setSummary(s);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, summary, loading, error, reload: load };
}
