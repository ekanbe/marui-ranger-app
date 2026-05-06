import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type CustomerOrderItem = {
  product_name: string;
  quantity: number;
  subtotal_jpy: number;
};

export type CustomerOrderRow = {
  id: string;
  order_code: string;
  ordered_at: string;
  total_amount_jpy: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  source: 'manual' | 'ec' | 'showroom' | 'bcart';
  items: CustomerOrderItem[];
};

type NestedOrder = {
  id: string;
  order_code: string;
  ordered_at: string;
  total_amount_jpy: number | null;
  status: 'pending' | 'confirmed' | 'shipped' | 'cancelled';
  source: 'manual' | 'ec' | 'showroom' | 'bcart' | null;
  order_items:
    | {
        quantity: number;
        subtotal_jpy: number | null;
        products: { name: string | null } | null;
      }[]
    | null;
};

export function useCustomerOrders(customerId: string | undefined, limit = 10) {
  const [orders, setOrders] = useState<CustomerOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `id, order_code, ordered_at, total_amount_jpy, status, source,
           order_items ( quantity, subtotal_jpy, products ( name ) )`
        )
        .eq('customer_id', customerId)
        .order('ordered_at', { ascending: false })
        .limit(limit);

      if (!mounted) return;
      if (error) console.warn('[useCustomerOrders]', error.message);

      const rows: CustomerOrderRow[] = ((data ?? []) as unknown as NestedOrder[]).map((o) => ({
        id: o.id,
        order_code: o.order_code,
        ordered_at: o.ordered_at,
        total_amount_jpy: Number(o.total_amount_jpy ?? 0),
        status: o.status,
        source: (o.source ?? 'manual'),
        items: (o.order_items ?? []).map((i) => ({
          product_name: i.products?.name ?? '-',
          quantity: Number(i.quantity ?? 0),
          subtotal_jpy: Number(i.subtotal_jpy ?? 0),
        })),
      }));
      setOrders(rows);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [customerId, limit]);

  return { orders, loading };
}
