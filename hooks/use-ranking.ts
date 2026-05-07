import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type RankingRow = {
  ranger_id: string;
  display_name: string;
  avatar_url: string | null;
  current_rank: string;
  sales_jpy: number;
  rank: number;
  ranger_number: number;
  isMe: boolean;
};

/**
 * レンジャー画面のランキング用フック。
 * v_ranking_this_month は受注のあるレンジャーしか返さないため、
 * 全レンジャー（rangers + profiles）と外部結合して受注ゼロも含めて表示する。
 */
export function useRanking(session: Session | null) {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const [rangersRes, rankingRes] = await Promise.all([
        supabase
          .from('rangers')
          .select(
            `id, ranger_code, current_rank,
             profiles!inner(display_name, avatar_url)`
          ),
        supabase
          .from('v_ranking_this_month')
          .select('ranger_id, sales_jpy'),
      ]);

      if (!mounted) return;
      if (rangersRes.error) console.warn('[useRanking] rangers', rangersRes.error.message);
      if (rankingRes.error) console.warn('[useRanking] ranking', rankingRes.error.message);

      const salesMap = new Map<string, number>();
      for (const r of (rankingRes.data ?? []) as Array<{ ranger_id: string; sales_jpy: number | string }>) {
        salesMap.set(r.ranger_id, Number(r.sales_jpy ?? 0));
      }

      const myId = session?.user.id;
      const rawRows = (rangersRes.data ?? []) as unknown as Array<{
        id: string;
        ranger_code: string | null;
        current_rank: string | null;
        profiles:
          | { display_name: string | null; avatar_url: string | null }
          | Array<{ display_name: string | null; avatar_url: string | null }>
          | null;
      }>;

      const merged = rawRows.map((r) => {
        const code = r.ranger_code ?? '';
        const numMatch = code.match(/(\d+)/);
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return {
          ranger_id: r.id,
          display_name: profile?.display_name ?? '（未設定）',
          avatar_url: profile?.avatar_url ?? null,
          current_rank: r.current_rank ?? 'bronze',
          sales_jpy: salesMap.get(r.id) ?? 0,
          ranger_number: numMatch ? Number(numMatch[1]) : 0,
        };
      });

      // 売上降順 → 同額なら ranger_number 昇順
      merged.sort((a, b) => {
        if (b.sales_jpy !== a.sales_jpy) return b.sales_jpy - a.sales_jpy;
        return a.ranger_number - b.ranger_number;
      });

      const ranked: RankingRow[] = merged.map((r, i) => ({
        ...r,
        rank: i + 1,
        isMe: r.ranger_id === myId,
      }));

      setRows(ranked);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  return { rows, loading };
}
