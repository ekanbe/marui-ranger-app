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
  isMe: boolean;
};

export function useRanking(session: Session | null) {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from('v_ranking_this_month')
        .select('ranger_id, display_name, avatar_url, current_rank, sales_jpy')
        .order('sales_jpy', { ascending: false });

      if (!mounted) return;
      if (error) console.warn('[useRanking]', error.message);

      const raw = (data ?? []) as Array<{
        ranger_id: string;
        display_name: string | null;
        avatar_url: string | null;
        current_rank: string | null;
        sales_jpy: number | string | null;
      }>;

      const myId = session?.user.id;
      const ranked: RankingRow[] = raw.map((r, i) => ({
        ranger_id: r.ranger_id,
        display_name: r.display_name ?? '-',
        avatar_url: r.avatar_url,
        current_rank: r.current_rank ?? 'bronze',
        sales_jpy: Number(r.sales_jpy ?? 0),
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
