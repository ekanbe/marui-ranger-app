import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: 'admin' | 'ranger' | 'maker' | null;
  avatar_url: string | null;
};

export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role, avatar_url')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) console.warn('[useProfile]', error.message);
    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await load();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  return { profile, loading, reload: load };
}
