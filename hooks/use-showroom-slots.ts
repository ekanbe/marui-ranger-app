import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type SlotAvailability = 'available' | 'booked' | 'overbooked';
export const SHOWROOM_HOURS = [10, 11, 13, 14, 15, 16] as const;

export type ShowroomSlot = {
  slot_date: string;
  slot_hour: number;
  slot_start_at: string;
  slot_end_at: string;
  booked_count: number;
  availability: SlotAvailability;
  customer_names: string[];
};

/**
 * 指定日数分のショールーム空き枠を取得
 * @param fromDate 開始日（YYYY-MM-DD or Date）。デフォルト：今日
 * @param days    取得日数。デフォルト：14日
 */
export function useShowroomSlots(fromDate?: string | Date, days = 14) {
  const [slots, setSlots] = useState<ShowroomSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const start = (() => {
    if (typeof fromDate === 'string') return fromDate;
    if (fromDate instanceof Date) return fromDate.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  })();
  const end = (() => {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  })();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('v_showroom_slots')
      .select('slot_date, slot_hour, slot_start_at, slot_end_at, booked_count, availability, customer_names')
      .gte('slot_date', start)
      .lt('slot_date', end)
      .order('slot_date', { ascending: true })
      .order('slot_hour', { ascending: true });

    if (err) {
      console.warn('[useShowroomSlots]', err.message);
      setError(err.message);
    }
    setSlots((data ?? []) as ShowroomSlot[]);
    setLoading(false);
  }, [start, end]);

  useEffect(() => { load(); }, [load]);

  return { slots, loading, error, reload: load };
}

/**
 * 顧客をショールームに招待する RPC 呼び出し
 */
export async function inviteCustomerToShowroom(
  customerId: string,
  scheduledAt: string,
  numVisitors?: number,
  notes?: string,
): Promise<{ ok: boolean; invitationId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('fn_invite_to_showroom', {
    p_customer_id: customerId,
    p_scheduled_at: scheduledAt,
    p_num_visitors: numVisitors ?? null,
    p_notes: notes ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, invitationId: data as string };
}
