import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type RecommendedCustomer = {
  id: string;
  name: string;
  branch_name: string | null;
  score: number;
};

export type BcartGroupPrice = {
  price_group_id: string;
  name: string;
  unit_price: number;
  rate: string;
};

export type BcartProductSet = {
  id: string;
  bcart_product_set_id: string;
  name: string | null;
  product_no: string | null;
  unit_price: number | null;
  group_prices: BcartGroupPrice[];
  special_price_count: number;     // 特別単価が登録されている顧客数
  stock: number | null;
  jan_code: string | null;
};

export type ProductDetail = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  pitch_script: string | null;
  pain_solution: string | null;
  maker_name: string;
  unit_price_jpy: number;
  solves_pain: string[];
  recommended_customers: RecommendedCustomer[];
  bcart_sets: BcartProductSet[];   // Bカート 販売単位（複数あり得る）
};

const PAIN_LABEL: Record<string, string> = {
  low_avg_spend: '客単価が伸びない',
  labor_shortage: '人手不足',
  differentiation: '他店との差別化',
  new_menu: '新メニュー導入',
  weak_takeout: 'テイクアウトが弱い',
  cost_ratio: '原価率を守りたい',
  young_female: '若年女性層狙い',
  espresso_machine: 'エスプレッソマシン有',
};

type NestedProduct = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  pitch_script: string | null;
  pain_solution: string | null;
  makers: { name: string | null } | null;
  product_prices: { unit_price_jpy: number; valid_from: string; valid_to: string | null }[] | null;
  product_attributes: { attribute_key: string; attribute_value: string }[] | null;
};

type NestedRecommendation = {
  score: number | string;
  customers: { id: string; name: string; branch_name: string | null } | null;
};

export function useProductDetail(productId: string | undefined) {
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      const [prodRes, recsRes, setsRes] = await Promise.all([
        supabase
          .from('products')
          .select(
            `id, name, category, image_url, pitch_script, pain_solution,
             makers ( name ),
             product_prices ( unit_price_jpy, valid_from, valid_to ),
             product_attributes ( attribute_key, attribute_value )`
          )
          .eq('id', productId)
          .maybeSingle(),
        supabase
          .from('recommendations')
          .select(`score, customers ( id, name, branch_name )`)
          .eq('product_id', productId)
          .order('score', { ascending: false })
          .limit(10),
        supabase
          .from('product_sets')
          .select(
            'id, bcart_product_set_id, name, product_no, unit_price, group_price, special_price, stock, jan_code',
          )
          .eq('product_id', productId)
          .order('unit_price', { ascending: true }),
      ]);

      if (!mounted) return;
      if (prodRes.error) console.warn('[useProductDetail product]', prodRes.error.message);
      if (recsRes.error) console.warn('[useProductDetail recs]', recsRes.error.message);
      if (setsRes.error) console.warn('[useProductDetail sets]', setsRes.error.message);

      const p = prodRes.data as unknown as NestedProduct | null;
      if (!p) {
        setDetail(null);
        setLoading(false);
        return;
      }

      const now = Date.now();
      const prices = p.product_prices ?? [];
      const active = prices
        .filter((pp) => !pp.valid_to || new Date(pp.valid_to).getTime() > now)
        .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime())[0];

      const solvesPain = (p.product_attributes ?? [])
        .filter((a) => a.attribute_key === 'solves_pain')
        .map((a) => PAIN_LABEL[a.attribute_value] ?? a.attribute_value);

      const recommended: RecommendedCustomer[] = ((recsRes.data ?? []) as unknown as NestedRecommendation[])
        .filter((r) => r.customers)
        .map((r) => ({
          id: r.customers!.id,
          name: r.customers!.name,
          branch_name: r.customers!.branch_name,
          score: Number(r.score ?? 0),
        }));

      // Bカート 販売単位
      type RawSet = {
        id: string;
        bcart_product_set_id: string;
        name: string | null;
        product_no: string | null;
        unit_price: number | null;
        group_price: Record<string, { name: string; rate: string; unit_price: number }> | null;
        special_price: Record<string, unknown> | null;
        stock: number | null;
        jan_code: string | null;
      };
      const rawSets = (setsRes.data ?? []) as RawSet[];
      const bcartSets = rawSets.map((s) => ({
        id: s.id,
        bcart_product_set_id: s.bcart_product_set_id,
        name: s.name,
        product_no: s.product_no,
        unit_price: s.unit_price,
        group_prices: s.group_price
          ? Object.entries(s.group_price).map(([k, v]) => ({
              price_group_id: k,
              name: v.name,
              unit_price: Number(v.unit_price),
              rate: v.rate,
            }))
          : [],
        special_price_count: s.special_price ? Object.keys(s.special_price).length : 0,
        stock: s.stock,
        jan_code: s.jan_code,
      }));

      setDetail({
        id: p.id,
        name: p.name,
        category: p.category,
        image_url: p.image_url,
        pitch_script: p.pitch_script,
        pain_solution: p.pain_solution,
        maker_name: p.makers?.name ?? '-',
        unit_price_jpy: Number(active?.unit_price_jpy ?? 0),
        solves_pain: solvesPain,
        recommended_customers: recommended,
        bcart_sets: bcartSets,
      });
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [productId]);

  return { detail, loading };
}
