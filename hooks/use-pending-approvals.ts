import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type PendingOrder = {
  id: string;
  order_code: string;
  ordered_at: string;
  total_amount_jpy: number;
  ranger_id: string;
  ranger_name: string;
  customer_id: string;
  customer_name: string;
  customer_image_url: string | null;
  product_name: string;
  quantity: number;
};

type NestedOrder = {
  id: string;
  order_code: string;
  ordered_at: string;
  total_amount_jpy: number;
  ranger_id: string;
  profiles: { display_name: string | null } | null;
  customers: {
    id: string;
    name: string | null;
    branch_name: string | null;
    image_url: string | null;
  } | null;
  order_items: { quantity: number; products: { name: string | null } | null }[] | null;
};

/**
 * 承認待ちの受注一覧。admin のみ意味を持つ。
 * onlyMine=true でログインユーザーが作成した受注のみ取得（レンジャー側用）。
 */
export function usePendingApprovals(session: Session | null, options: { onlyMine?: boolean } = {}) {
  const { onlyMine = false } = options;
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadAt, setReloadAt] = useState(0);

  // session オブジェクト自体を依存にすると TOKEN_REFRESHED のたびに再フェッチされるため user.id で見る
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select(
          `id, order_code, ordered_at, total_amount_jpy, ranger_id,
           profiles:ranger_id ( display_name ),
           customers ( id, name, branch_name, image_url ),
           order_items ( quantity, products ( name ) )`
        )
        .eq('status', 'pending')
        .order('ordered_at', { ascending: false });

      if (onlyMine) {
        query = query.eq('ranger_id', userId);
      }

      const { data, error: qerr } = await query;

      if (!mounted) return;
      if (qerr) {
        console.warn('[usePendingApprovals]', qerr.message);
        setError(qerr.message);
        setLoading(false);
        return;
      }

      const raw = (data ?? []) as unknown as NestedOrder[];
      const result: PendingOrder[] = raw.map((o) => {
        const item0 = o.order_items?.[0];
        return {
          id: o.id,
          order_code: o.order_code,
          ordered_at: o.ordered_at,
          total_amount_jpy: Number(o.total_amount_jpy ?? 0),
          ranger_id: o.ranger_id,
          ranger_name: o.profiles?.display_name ?? '-',
          customer_id: o.customers?.id ?? '',
          customer_name: [o.customers?.name, o.customers?.branch_name].filter(Boolean).join(' ') || '-',
          customer_image_url: o.customers?.image_url ?? null,
          product_name: item0?.products?.name ?? '-',
          quantity: Number(item0?.quantity ?? 0),
        };
      });
      setOrders(result);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [userId, onlyMine, reloadAt]);

  return { orders, loading, error, reload: () => setReloadAt(Date.now()) };
}
