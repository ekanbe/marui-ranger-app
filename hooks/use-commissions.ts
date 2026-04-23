import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type CommissionStatus = 'pending' | 'confirmed' | 'paid';

export type CommissionRow = {
  id: string;
  ranger_amount_jpy: number;
  status: CommissionStatus;
  created_at: string;
  product_name: string;
  customer_name: string;
  ordered_at: string;
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
          customers: { name: string | null; branch_name: string | null } | null;
        } | null;
      }
    | null;
};

export function useCommissions(session: Session | null) {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setRows([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select(
          `id, ranger_amount_jpy, status, created_at,
           order_items!inner (
             id,
             products ( name ),
             orders!inner (
               ordered_at,
               customers ( name, branch_name )
             )
           )`
        )
        .eq('ranger_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;
      if (error) console.warn('[useCommissions]', error.message);

      const raw = (data ?? []) as unknown as NestedCommission[];
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
          ordered_at: c.order_items?.orders?.ordered_at ?? '',
        };
      });

      setRows(result);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  return { rows, loading };
}
