import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type BadgeRow = {
  code: string;
  name: string;
  description: string | null;
  earned: boolean;
};

export function useRangerBadges(session: Session | null) {
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const badgesRes = await supabase
        .from('badges')
        .select('id, code, name, description')
        .order('code');

      const earnedRes = session
        ? await supabase.from('ranger_badges').select('badge_id').eq('ranger_id', session.user.id)
        : { data: [] as { badge_id: string }[], error: null };

      if (!mounted) return;
      if (badgesRes.error) console.warn('[useRangerBadges badges]', badgesRes.error.message);
      if (earnedRes && 'error' in earnedRes && earnedRes.error) {
        console.warn('[useRangerBadges earned]', earnedRes.error.message);
      }

      const earnedSet = new Set(((earnedRes.data ?? []) as { badge_id: string }[]).map((r) => r.badge_id));

      const result: BadgeRow[] = ((badgesRes.data ?? []) as { id: string; code: string; name: string; description: string | null }[]).map(
        (b) => ({
          code: b.code,
          name: b.name,
          description: b.description,
          earned: earnedSet.has(b.id),
        })
      );
      setBadges(result);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  return { badges, loading };
}
