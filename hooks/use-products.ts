import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type ProductRow = {
  id: string;
  name: string;
  category: string | null;
  image_url: string | null;
  pitch_script: string | null;
  pain_solution: string | null;
  maker_name: string;
  unit_price_jpy: number;
  solves_pain: string[];
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

export function useProducts() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          `id, name, category, image_url, pitch_script, pain_solution,
           makers ( name ),
           product_prices ( unit_price_jpy, valid_from, valid_to ),
           product_attributes ( attribute_key, attribute_value )`
        )
        .eq('is_active', true)
        .order('name');

      if (!mounted) return;
      if (error) console.warn('[useProducts]', error.message);

      const rows: ProductRow[] = ((data ?? []) as unknown as NestedProduct[]).map((p) => {
        const prices = p.product_prices ?? [];
        const now = Date.now();
        const active = prices
          .filter((pp) => !pp.valid_to || new Date(pp.valid_to).getTime() > now)
          .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime())[0];

        const attrs = p.product_attributes ?? [];
        const solvesPain = attrs
          .filter((a) => a.attribute_key === 'solves_pain')
          .map((a) => PAIN_LABEL[a.attribute_value] ?? a.attribute_value);

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          image_url: p.image_url,
          pitch_script: p.pitch_script,
          pain_solution: p.pain_solution,
          maker_name: p.makers?.name ?? '-',
          unit_price_jpy: Number(active?.unit_price_jpy ?? 0),
          solves_pain: solvesPain,
        };
      });

      setProducts(rows);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { products, loading };
}
