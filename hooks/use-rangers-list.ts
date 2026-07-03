import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type RangerListItem = {
  ranger_id: string;
  ranger_code: string;
  ranger_number: number;
  display_name: string;
  avatar_url: string | null;
  current_rank: string;
  monthly_goal_jpy: number;
  joined_at: string | null;
  this_month_sales_jpy: number;
  this_month_order_count: number;
};

/**
 * レンジャー管理画面用：受注ゼロのレンジャーも含めて全件取得。
 * 売上は v_ranking_this_month から ranger_id でマージ（無ければ 0）。
 */
export function useRangersList() {
  const [rangers, setRangers] = useState<RangerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const [rangersRes, rankingRes] = await Promise.all([
        supabase
          .from('rangers')
          .select(
            `id, ranger_code, current_rank, monthly_goal_jpy, joined_at,
             profiles!inner(display_name, avatar_url)`
          ),
        supabase
          .from('v_ranking_this_month')
          .select('ranger_id, sales_jpy, order_count'),
      ]);

      if (!mounted) return;
      if (rangersRes.error) console.warn('[useRangersList] rangers', rangersRes.error.message);
      if (rankingRes.error) console.warn('[useRangersList] ranking', rankingRes.error.message);
      if (rangersRes.error || rankingRes.error) {
        setError(rangersRes.error?.message ?? rankingRes.error?.message ?? 'unknown error');
        setLoading(false);
        return;
      }

      const salesMap = new Map<string, { sales_jpy: number; order_count: number }>();
      for (const r of (rankingRes.data ?? []) as Array<{
        ranger_id: string;
        sales_jpy: number | string;
        order_count: number | string;
      }>) {
        salesMap.set(r.ranger_id, {
          sales_jpy: Number(r.sales_jpy ?? 0),
          order_count: Number(r.order_count ?? 0),
        });
      }

      const rawRows = (rangersRes.data ?? []) as unknown as Array<{
        id: string;
        ranger_code: string | null;
        current_rank: string | null;
        monthly_goal_jpy: number | string | null;
        joined_at: string | null;
        // PostgREST のネスト select は配列で返ることもオブジェクトで返ることもあるので両対応
        profiles:
          | { display_name: string | null; avatar_url: string | null }
          | Array<{ display_name: string | null; avatar_url: string | null }>
          | null;
      }>;

      const list: RangerListItem[] = rawRows.map((r) => {
        const code = r.ranger_code ?? '';
        const numMatch = code.match(/(\d+)/);
        const numberFromCode = numMatch ? Number(numMatch[1]) : 0;
        const sales = salesMap.get(r.id);
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return {
          ranger_id: r.id,
          ranger_code: code,
          ranger_number: numberFromCode,
          display_name: profile?.display_name ?? '（未設定）',
          avatar_url: profile?.avatar_url ?? null,
          current_rank: r.current_rank ?? 'BRONZE',
          monthly_goal_jpy: Number(r.monthly_goal_jpy ?? 0),
          joined_at: r.joined_at,
          this_month_sales_jpy: sales?.sales_jpy ?? 0,
          this_month_order_count: sales?.order_count ?? 0,
        };
      });

      // 売上順、同額なら ranger_number 昇順
      list.sort((a, b) => {
        if (b.this_month_sales_jpy !== a.this_month_sales_jpy) {
          return b.this_month_sales_jpy - a.this_month_sales_jpy;
        }
        return a.ranger_number - b.ranger_number;
      });

      setRangers(list);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { rangers, loading, error, reload };
}
