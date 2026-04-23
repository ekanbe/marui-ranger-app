import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type NotificationType = 'order' | 'achievement' | 'alert' | 'recommend' | 'progress';

export type NotificationRow = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_to: string | null;
  read_at: string | null;
  created_at: string;
};

export function useNotifications(session: Session | null) {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setRows([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, link_to, read_at, created_at')
        .eq('ranger_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;
      if (error) console.warn('[useNotifications]', error.message);
      setRows((data as NotificationRow[]) ?? []);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  return { rows, loading };
}
