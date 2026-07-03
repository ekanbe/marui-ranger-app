import { useCallback, useEffect, useState } from 'react';

import { fetchAll, supabase } from '@/lib/supabase';
import type { SalesPhase } from '@/lib/sales-phase';

export type Recommendation = {
  id: string;
  score: number;
  reason: string | null;
  product_id: string;
  product_name: string;
  pitch_script: string | null;
};

export type CustomerDetail = {
  id: string;
  name: string;
  branch_name: string | null;
  address: string | null;
  business_type: string | null;
  customer_code: string;
  image_url: string | null;
  last_ordered_at: string | null;
  sales_phase: SalesPhase | null;
  sales_phase_updated_at: string | null;
  acquired_by_ranger_id: string | null;
  painPoints: string[];
  monthSalesJpy: number;
  totalSalesJpy: number;
  monthMarginJpy: number;
  recommendations: Recommendation[];
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

type NestedRecommendation = {
  id: string;
  score: number | string;
  reason: string | null;
  products: { id: string; name: string | null; pitch_script: string | null } | null;
};

export function useCustomerDetail(customerId: string | undefined) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      setDetail(null);
      return;
    }
    setError(null);

    const [custRes, ordersRes, recsRes] = await Promise.all([
      supabase
        .from('customers')
        .select(
          `id, name, branch_name, address, business_type, customer_code, status, image_url, last_ordered_at,
           sales_phase, sales_phase_updated_at, acquired_by_ranger_id,
           customer_attributes ( attribute_key, attribute_value )`
        )
        .eq('id', customerId)
        .maybeSingle(),
      // 累計売上の集計用。1000 行を超え得るため fetchAll でページング取得
      fetchAll<{ ordered_at: string; total_amount_jpy: number | null }>(() =>
        supabase
          .from('orders')
          .select('ordered_at, total_amount_jpy')
          .eq('customer_id', customerId)
          .order('ordered_at', { ascending: true })
          .order('id') // ページング安定化のためのタイブレーク
      ),
      supabase
        .from('recommendations')
        .select(
          `id, score, reason,
           products ( id, name, pitch_script )`
        )
        .eq('customer_id', customerId)
        .order('score', { ascending: false })
        .limit(3),
    ]);

    if (custRes.error) console.warn('[useCustomerDetail cust]', custRes.error.message);
    if (ordersRes.error) console.warn('[useCustomerDetail orders]', ordersRes.error);
    if (recsRes.error) console.warn('[useCustomerDetail recs]', recsRes.error.message);
    if (custRes.error) {
      // 顧客本体が取れなければ詳細は組み立てられない
      setError(custRes.error.message);
      setDetail(null);
      setLoading(false);
      return;
    }

    const cust = custRes.data as
      | {
          id: string;
          name: string;
          branch_name: string | null;
          address: string | null;
          business_type: string | null;
          customer_code: string;
          image_url: string | null;
          last_ordered_at: string | null;
          sales_phase: SalesPhase | null;
          sales_phase_updated_at: string | null;
          acquired_by_ranger_id: string | null;
          customer_attributes: { attribute_key: string; attribute_value: string }[] | null;
        }
      | null;

    // 顧客が見つからない場合は空オブジェクトではなく null を返す（画面側で「見つかりません」表示）
    if (!cust) {
      setDetail(null);
      setLoading(false);
      return;
    }

    const orders = ordersRes.data;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalSales = orders.reduce((s, o) => s + Number(o.total_amount_jpy ?? 0), 0);
    const monthSales = orders
      .filter((o) => new Date(o.ordered_at) >= monthStart)
      .reduce((s, o) => s + Number(o.total_amount_jpy ?? 0), 0);

    const painPoints = (cust.customer_attributes ?? [])
      .filter((a) => a.attribute_key === 'pain_point')
      .map((a) => PAIN_LABEL_FALLBACK(a.attribute_value));

    const recommendations: Recommendation[] = ((recsRes.data ?? []) as unknown as NestedRecommendation[]).map(
      (r) => ({
        id: r.id,
        score: Number(r.score ?? 0),
        reason: r.reason,
        product_id: r.products?.id ?? '',
        product_name: r.products?.name ?? '-',
        pitch_script: r.products?.pitch_script ?? null,
      })
    );

    setDetail({
      id: cust.id,
      name: cust.name,
      branch_name: cust.branch_name,
      address: cust.address,
      business_type: cust.business_type,
      customer_code: cust.customer_code,
      image_url: cust.image_url,
      last_ordered_at: cust.last_ordered_at,
      sales_phase: cust.sales_phase,
      sales_phase_updated_at: cust.sales_phase_updated_at,
      acquired_by_ranger_id: cust.acquired_by_ranger_id,
      painPoints,
      monthSalesJpy: monthSales,
      totalSalesJpy: totalSales,
      monthMarginJpy: Math.round(monthSales * 0.02),
      recommendations,
    });
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    let mounted = true;
    fetchDetail().then(() => { if (!mounted) return; });
    return () => { mounted = false; };
  }, [fetchDetail]);

  return { detail, loading, error, refetch: fetchDetail, reload: fetchDetail };
}
