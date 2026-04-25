import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type LineSyncLog = {
  id: string;
  sync_started_at: string;
  sync_ended_at: string | null;
  fetched: number;
  matched: number;
  unmatched: number;
  cancelled: number;
  duplicated: number;
  status: 'running' | 'success' | 'failed';
  error_message: string | null;
};

export type ShowroomInvitationRow = {
  id: string;
  scheduled_at: string | null;
  status: 'invited' | 'confirmed' | 'visited' | 'cancelled';
  source: 'manual' | 'line' | 'direct';
  customer_id: string;
  customer_name: string;
  ranger_id: string;
  ranger_name: string | null;
  visitor_company: string | null;
  visitor_contact_name: string | null;
  num_visitors: number | null;
  interest_products: string[] | null;
};

export type UnmatchedBookingRow = {
  id: string;
  scheduled_at: string;
  visitor_company: string | null;
  visitor_contact_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  visitor_business_type: string | null;
  num_visitors: number | null;
  interest_products: string[] | null;
  visitor_notes: string | null;
  resolved: boolean;
};

export type LineShowroomData = {
  lastSync: LineSyncLog | null;
  recentLogs: LineSyncLog[];
  weekly: { fetched: number; matched: number; unmatched: number; cancelled: number };
  upcomingInvitations: ShowroomInvitationRow[];
  unmatched: UnmatchedBookingRow[];
};

export function useLineShowroom() {
  const [data, setData] = useState<LineShowroomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. 同期ログ
      const { data: logs, error: logsErr } = await supabase
        .from('line_sync_log')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(10);
      if (logsErr) throw logsErr;
      const recentLogs = (logs ?? []) as LineSyncLog[];
      const lastSync = recentLogs[0] ?? null;

      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const weekly = recentLogs
        .filter((l) => l.sync_started_at >= sevenDaysAgo && l.status === 'success')
        .reduce(
          (a, l) => ({
            fetched: a.fetched + (l.fetched ?? 0),
            matched: a.matched + (l.matched ?? 0),
            unmatched: a.unmatched + (l.unmatched ?? 0),
            cancelled: a.cancelled + (l.cancelled ?? 0),
          }),
          { fetched: 0, matched: 0, unmatched: 0, cancelled: 0 }
        );

      // 2. 直近の招待一覧（未来分のみ）
      const nowIso = new Date().toISOString();
      const { data: invs } = await supabase
        .from('showroom_invitations')
        .select(
          `id, scheduled_at, status, source, customer_id, ranger_id,
           num_visitors, interest_products, visitor_company, visitor_contact_name`
        )
        .gte('scheduled_at', nowIso)
        .neq('status', 'cancelled')
        .order('scheduled_at', { ascending: true })
        .limit(50);

      type RawInv = {
        id: string;
        scheduled_at: string | null;
        status: ShowroomInvitationRow['status'];
        source: ShowroomInvitationRow['source'];
        customer_id: string;
        ranger_id: string;
        num_visitors: number | null;
        interest_products: string[] | null;
        visitor_company: string | null;
        visitor_contact_name: string | null;
      };
      const invRows = (invs ?? []) as RawInv[];

      // customers 名・rangers 名を別途取得
      const customerIds = [...new Set(invRows.map((r) => r.customer_id))];
      const rangerIds = [...new Set(invRows.map((r) => r.ranger_id))];

      const [{ data: cs }, { data: ps }] = await Promise.all([
        customerIds.length > 0
          ? supabase.from('customers').select('id, name').in('id', customerIds)
          : Promise.resolve({ data: [] }),
        rangerIds.length > 0
          ? supabase.from('profiles').select('id, display_name').in('id', rangerIds)
          : Promise.resolve({ data: [] }),
      ]);
      const cMap = new Map<string, string>();
      for (const c of (cs ?? []) as Array<{ id: string; name: string }>) cMap.set(c.id, c.name);
      const pMap = new Map<string, string>();
      for (const p of (ps ?? []) as Array<{ id: string; display_name: string }>)
        pMap.set(p.id, p.display_name);

      const upcomingInvitations: ShowroomInvitationRow[] = invRows.map((r) => ({
        id: r.id,
        scheduled_at: r.scheduled_at,
        status: r.status,
        source: r.source,
        customer_id: r.customer_id,
        customer_name: cMap.get(r.customer_id) ?? '?',
        ranger_id: r.ranger_id,
        ranger_name: pMap.get(r.ranger_id) ?? null,
        visitor_company: r.visitor_company,
        visitor_contact_name: r.visitor_contact_name,
        num_visitors: r.num_visitors,
        interest_products: r.interest_products,
      }));

      // 3. 未マッチ
      const { data: um } = await supabase
        .from('showroom_bookings_unmatched')
        .select('*')
        .eq('resolved', false)
        .order('scheduled_at', { ascending: true })
        .limit(100);

      const unmatched = (um ?? []) as UnmatchedBookingRow[];

      setData({ lastSync, recentLogs, weekly, upcomingInvitations, unmatched });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

/**
 * 未マッチを customers + ranger に紐付け
 */
export async function resolveUnmatchedBooking(
  unmatchedId: string,
  customerId: string,
  rangerId: string
): Promise<{ ok: boolean; invitationId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('fn_resolve_unmatched_showroom_booking', {
    p_unmatched_id: unmatchedId,
    p_customer_id: customerId,
    p_ranger_id: rangerId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, invitationId: data as string };
}

/**
 * showroom_invitations の status 変更（admin / 担当ranger）
 */
export async function updateInvitationStatus(
  invitationId: string,
  newStatus: 'invited' | 'confirmed' | 'visited' | 'cancelled'
) {
  const { error } = await supabase
    .from('showroom_invitations')
    .update({ status: newStatus })
    .eq('id', invitationId);
  return { ok: !error, error: error?.message };
}

/**
 * 招待キャンセル
 */
export async function cancelInvitation(invitationId: string, reason?: string) {
  const { error } = await supabase.rpc('fn_cancel_showroom_invitation', {
    p_invitation_id: invitationId,
    p_reason: reason ?? null,
  });
  return { ok: !error, error: error?.message };
}

/**
 * 招待日時変更
 */
export async function rescheduleInvitation(invitationId: string, newScheduledAt: string) {
  const { error } = await supabase.rpc('fn_reschedule_showroom_invitation', {
    p_invitation_id: invitationId,
    p_new_scheduled_at: newScheduledAt,
  });
  return { ok: !error, error: error?.message };
}

/**
 * 来場済 + 試食記録（特許要件④）
 */
export async function recordShowroomVisit(
  invitationId: string,
  tastedProductIds?: string[],
  memo?: string,
) {
  const { data, error } = await supabase.rpc('fn_record_showroom_visit', {
    p_invitation_id: invitationId,
    p_tasted_products: tastedProductIds && tastedProductIds.length > 0 ? tastedProductIds : null,
    p_memo: memo ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, visitId: data as string };
}
