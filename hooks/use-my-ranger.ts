import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type MyRanger = {
  ranger_code: string;
  current_rank: string;
  monthly_goal_jpy: number;
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
    supabase
      .from('rangers')
      .select('ranger_code, current_rank, monthly_goal_jpy')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.warn('[useMyRanger]', error.message);
        setRanger((data as MyRanger | null) ?? null);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [session]);

  return { ranger, loading };
}
