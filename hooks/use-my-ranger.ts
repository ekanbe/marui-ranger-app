import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type MyRanger = {
  ranger_code: string;
  current_rank: string;
  monthly_goal_jpy: number;
  ranger_number: number;
};

export function useMyRanger(session: Session | null) {
  const [ranger, setRanger] = useState<MyRanger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setRanger(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const [rangerRes, numberRes] = await Promise.all([
        supabase
          .from('rangers')
          .select('ranger_code, current_rank, monthly_goal_jpy')
          .eq('id', session.user.id)
          .maybeSingle(),
        supabase
          .from('v_ranger_numbers')
          .select('ranger_number')
          .eq('ranger_id', session.user.id)
          .maybeSingle(),
      ]);
      if (!mounted) return;
      if (rangerRes.error) console.warn('[useMyRanger]', rangerRes.error.message);
      const base = rangerRes.data as
        | { ranger_code: string; current_rank: string; monthly_goal_jpy: number }
        | null;
      if (!base) {
        setRanger(null);
      } else {
        const num = numberRes.data as { ranger_number: number | string } | null;
        setRanger({ ...base, ranger_number: Number(num?.ranger_number ?? 0) });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [session]);

  return { ranger, loading };
}
