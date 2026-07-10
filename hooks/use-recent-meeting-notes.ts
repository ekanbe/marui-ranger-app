import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type RecentMeetingNote = {
  id: string;
  customer_id: string;
  met_at: string;
  title: string | null;
  body: string;
  next_action: string | null;
  customer_name: string;
  branch_name: string | null;
};

/**
 * ホーム表示用: 自分の担当顧客の直近の商談ログ(議事録)。
 * 議事録は重要な情報なのに顧客検索を辿らないと見えない、という
 * 松永さんFB(2026-07-10)を受けてホームに直近数件を出す。
 * RLS(担当レンジャー or admin)がそのまま効くので絞り込みは不要。
 */
export function useRecentMeetingNotes(session: Session | null, limit = 5) {
  const [notes, setNotes] = useState<RecentMeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      setNotes([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('meeting_notes')
        .select('id, customer_id, met_at, title, body, next_action, customers ( name, branch_name )')
        .order('met_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!mounted) return;
      if (error) console.warn('[useRecentMeetingNotes]', error.message);
      const rows: RecentMeetingNote[] = ((data as any[]) ?? []).map((n) => ({
        id: n.id,
        customer_id: n.customer_id,
        met_at: n.met_at,
        title: n.title,
        body: n.body,
        next_action: n.next_action,
        customer_name: n.customers?.name ?? '-',
        branch_name: n.customers?.branch_name ?? null,
      }));
      setNotes(rows);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [session, reloadKey, limit]);

  return { notes, loading, reload: () => setReloadKey((k) => k + 1) };
}
