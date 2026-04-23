import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: 'admin' | 'ranger' | 'maker' | null;
};

export function useProfile(session: Session | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('profiles')
      .select('id, display_name, email, role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.warn('[useProfile]', error.message);
        setProfile((data as Profile | null) ?? null);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session]);

  return { profile, loading };
}
