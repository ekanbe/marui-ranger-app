import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type MeetingNote = {
  id: string;
  customer_id: string;
  met_at: string; // date (YYYY-MM-DD)
  title: string | null;
  attendees: string | null;
  body: string;
  next_action: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingNoteInput = {
  customer_id: string;
  met_at: string;
  title: string | null;
  attendees: string | null;
  body: string;
  next_action: string | null;
};

export function useMeetingNotes(customerId: string | undefined) {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      setNotes([]);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('meeting_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('met_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (!mounted) return;
      if (error) console.warn('[useMeetingNotes]', error.message);
      setNotes((data as MeetingNote[]) ?? []);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [customerId, reloadKey]);

  return {
    notes,
    loading,
    reload: () => setReloadKey((k) => k + 1),
  };
}

export async function addMeetingNote(input: MeetingNoteInput, rangerId: string | null) {
  const { error } = await supabase.from('meeting_notes').insert({
    ...input,
    created_by: rangerId,
  });
  if (error) throw error;
}

export async function deleteMeetingNote(id: string) {
  const { error } = await supabase.from('meeting_notes').delete().eq('id', id);
  if (error) throw error;
}
