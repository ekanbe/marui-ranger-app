import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type CustomerDetail = {
  id: string;
  name: string;
  branch_name: string | null;
  address: string | null;
  business_type: string | null;
  customer_code: string;
  last_ordered_at: string | null;
  painPoints: string[];
  monthSalesJpy: number;
  totalSalesJpy: number;
  monthMarginJpy: number;
};

const PAIN_LABEL: Record<string, string> = {
  labor_shortage: '人手不足',
  low_avg_spend: '客単価が伸びない',
  new_menu: '新メニュー導入',
  weak_takeout: 'テイクアウトが弱い',
  cost_ratio: '原価率を守りたい',
  differentiation: '他店との差別化',
  young_female: '若年女性層狙い',
  espresso_machine: 'エスプレッソマシン有',
};

const PAIN_LABEL_FALLBACK = (key: string) => PAIN_LABEL[key] ?? key;

export function useCustomerDetail(customerId: string | undefined) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      setDetail(null);
      return;
    }
    let mounted = true;

    (async () => {
      const [custRes, ordersRes] = await Promise.all([
        supabase
          .from('customers')
          .select(
            `id, name, branch_name, address, business_type, customer_code, status, last_ordered_at,
             customer_attributes ( attribute_key, attribute_value )`
          )
          .eq('id', customerId)
          .maybeSingle(),
        supabase
          .from('orders')
          .select('ordered_at, total_amount_jpy')
          .eq('customer_id', customerId),
      ]);

      if (!mounted) return;

      if (custRes.error) console.warn('[useCustomerDetail cust]', custRes.error.message);
      if (ordersRes.error) console.warn('[useCustomerDetail orders]', ordersRes.error.message);

      const cust = custRes.data as
        | {
            id: string;
            name: string;
            branch_name: string | null;
            address: string | null;
            business_type: string | null;
            customer_code: string;
            last_ordered_at: string | null;
            customer_attributes: { attribute_key: string; attribute_value: string }[] | null;
          }
        | null;

      const orders = (ordersRes.data ?? []) as { ordered_at: string; total_amount_jpy: number | null }[];

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const totalSales = orders.reduce((s, o) => s + Number(o.total_amount_jpy ?? 0), 0);
      const monthSales = orders
        .filter((o) => new Date(o.ordered_at) >= monthStart)
        .reduce((s, o) => s + Number(o.total_amount_jpy ?? 0), 0);

      const painPoints = (cust?.customer_attributes ?? [])
        .filter((a) => a.attribute_key === 'pain_point')
        .map((a) => PAIN_LABEL_FALLBACK(a.attribute_value));

      setDetail({
        id: cust?.id ?? customerId,
        name: cust?.name ?? '',
        branch_name: cust?.branch_name ?? null,
        address: cust?.address ?? null,
        business_type: cust?.business_type ?? null,
        customer_code: cust?.customer_code ?? '',
        last_ordered_at: cust?.last_ordered_at ?? null,
        painPoints,
        monthSalesJpy: monthSales,
        totalSalesJpy: totalSales,
        monthMarginJpy: Math.round(monthSales * 0.02),
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [customerId]);

  return { detail, loading };
}
