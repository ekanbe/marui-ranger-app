import { useCallback, useEffect, useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // session オブジェクト自体を依存にすると TOKEN_REFRESHED のたびに再フェッチされるため user.id で見る
  const userId = session?.user.id;

  useEffect(() => {
    if (!userId) {
      setRows([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data, error: qerr } = await supabase
        .from('notifications')
        .select('id, type, title, body, link_to, read_at, created_at')
        .eq('ranger_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!mounted) return;
      if (qerr) {
        console.warn('[useNotifications]', qerr.message);
        setError(qerr.message);
        setLoading(false);
        return;
      }
      setRows((data as NotificationRow[]) ?? []);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [userId, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { rows, loading, error, reload };
}
