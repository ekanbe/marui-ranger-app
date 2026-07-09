import { useCallback, useEffect, useState } from 'react';

import { fetchAll, supabase } from '@/lib/supabase';

export type CostCatalogItem = {
  id: string;
  name: string;
  maker: string | null;
  category: string | null;
  cost_price_jpy: number;
  units_per_ball: number | null; // 1ボールあたりのバラ数
  balls_per_case: number | null; // 1ケースあたりのボール数
  units_per_case: number | null; // 1ケースあたりのバラ総数
  case_cost_jpy: number | null; // ケース原価(原価バラ×バラ総数)
  image_url: string | null;
};

export function useCostCatalog() {
  const [items, setItems] = useState<CostCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    fetchAll<CostCatalogItem>(() =>
      supabase
        .from('cost_catalog')
        .select('id, name, maker, category, cost_price_jpy, units_per_ball, balls_per_case, units_per_case, case_cost_jpy, image_url')
        .order('name')
    ).then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('[useCostCatalog]', error);
        setError(error);
      }
      setItems(
        data.map((r) => ({
          ...r,
          cost_price_jpy: Number(r.cost_price_jpy),
          case_cost_jpy: r.case_cost_jpy != null ? Number(r.case_cost_jpy) : null,
        }))
      );
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { items, loading, error, reload };
}
