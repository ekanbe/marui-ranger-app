import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { PROGRAM_START_MONTH } from '@/lib/program';
import { fetchAll, supabase } from '@/lib/supabase';

export type CommissionStatus = 'pending' | 'confirmed' | 'paid';
export type OrderSource = 'manual' | 'ec' | 'showroom' | 'bcart';

export type CommissionRow = {
  id: string;
  ranger_amount_jpy: number;
  status: CommissionStatus;
  created_at: string;
  product_name: string;
  customer_name: string;
  customer_image_url: string | null;
  ordered_at: string;
  source: OrderSource;
};

type NestedCommission = {
  id: string;
  ranger_amount_jpy: number | string;
  status: CommissionStatus;
  created_at: string;
  order_items:
    | {
        id: string;
        products: { name: string | null } | null;
        orders: {
          ordered_at: string;
          source: OrderSource | null;
          customers: { name: string | null; branch_name: string | null; image_url: string | null } | null;
        } | null;
      }
    | null;
};

export function useCommissions(session: Session | null) {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // session オブジェクト自体を依存にすると TOKEN_REFRESHED のたびに再フェッチされるため user.id で見る
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      // 累計マージンの集計に使うため全件必要。1000 行を超え得るので fetchAll でページング取得
      const { data, error: qerr } = await fetchAll<NestedCommission>(() =>
        supabase
          .from('commissions')
          .select(
            `id, ranger_amount_jpy, status, created_at,
             order_items!inner (
               id,
               products ( name ),
               orders!inner (
                 ordered_at,
                 source,
                 customers ( name, branch_name, image_url )
               )
             )`
          )
          .eq('ranger_id', userId)
          .order('created_at', { ascending: false })
          .order('id') // ページング安定化のためのタイブレーク
      );

      if (!mounted) return;
      if (qerr) {
        console.warn('[useCommissions]', qerr);
        setError(qerr);
        setLoading(false);
        return;
      }

      const raw = data;
      const result: CommissionRow[] = raw.map((c) => {
        const cust = c.order_items?.orders?.customers ?? null;
        const customerName = [cust?.name, cust?.branch_name].filter(Boolean).join(' ');
        return {
          id: c.id,
          ranger_amount_jpy: Number(c.ranger_amount_jpy ?? 0),
          status: c.status,
          created_at: c.created_at,
          product_name: c.order_items?.products?.name ?? '-',
          customer_name: customerName || '-',
          customer_image_url: cust?.image_url ?? null,
          ordered_at: c.order_items?.orders?.ordered_at ?? '',
          source: (c.order_items?.orders?.source ?? 'manual') as OrderSource,
        };
      });

      // レンジャー制度開始(2026年4月)より前の発注に紐づくマージンは表示・集計対象外
      setRows(result.filter((r) => r.ordered_at >= PROGRAM_START_MONTH));
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [userId, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { rows, loading, error, reload };
}
