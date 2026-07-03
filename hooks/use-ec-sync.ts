import { useCallback, useEffect, useState } from 'react';

import { fetchAll, supabase } from '@/lib/supabase';

export type EcSyncLog = {
  id: string;
  sync_started_at: string;
  sync_ended_at: string | null;
  fetch_from: string;
  fetch_to: string;
  orders_fetched: number;
  orders_matched: number;
  orders_unmatched: number;
  orders_duplicated: number;
  status: 'running' | 'success' | 'failed';
  error_message: string | null;
};

export type UnmatchedGroup = {
  ec_member_id: string | null;
  order_count: number;
  total_yen: number;
  earliest_date: string;
  latest_date: string;
  first_unmatched_id: string;
  sample_order_numbers: string[];
};

export type LinkedCustomer = {
  customer_id: string;
  customer_name: string;
  branch_name: string | null;
  ec_member_id: string;
  ec_linked_at: string;
  ranger_name: string | null;
  ec_order_count: number;
  ec_total_yen: number;
  ec_commission_yen: number;
};

export type EcSyncData = {
  lastSync: EcSyncLog | null;
  recentLogs: EcSyncLog[];
  weekly: { fetched: number; matched: number; unmatched: number; duplicated: number };
  unmatchedGroups: UnmatchedGroup[];
  linkedCustomers: LinkedCustomer[];
};

export function useEcSync() {
  const [data, setData] = useState<EcSyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ① 同期ログ（直近10件）
      const { data: logs, error: logsErr } = await supabase
        .from('ec_sync_log')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(10);
      if (logsErr) throw logsErr;
      const recentLogs = (logs ?? []) as EcSyncLog[];
      const lastSync = recentLogs[0] ?? null;

      // 直近7日のサマリ（直近10件だけでは数時間分しか拾えないため、7日分の専用クエリで集計）
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const weeklyRes = await fetchAll<{
        orders_fetched: number | null;
        orders_matched: number | null;
        orders_unmatched: number | null;
        orders_duplicated: number | null;
      }>(() =>
        supabase
          .from('ec_sync_log')
          .select('orders_fetched, orders_matched, orders_unmatched, orders_duplicated')
          .eq('status', 'success')
          .gte('sync_started_at', sevenDaysAgo)
          .order('sync_started_at', { ascending: false })
          .order('id')
      );
      if (weeklyRes.error) throw new Error(weeklyRes.error);
      const weekly = weeklyRes.data.reduce(
        (acc, l) => ({
          fetched: acc.fetched + (l.orders_fetched ?? 0),
          matched: acc.matched + (l.orders_matched ?? 0),
          unmatched: acc.unmatched + (l.orders_unmatched ?? 0),
          duplicated: acc.duplicated + (l.orders_duplicated ?? 0),
        }),
        { fetched: 0, matched: 0, unmatched: 0, duplicated: 0 }
      );

      // ② 未マッチ注文を memberId でグループ化
      //   limit(2000) は PostgREST の 1000 行上限で切られるため fetchAll でページング取得
      type UnmatchedRow = {
        id: string;
        ec_order_number: string;
        ec_member_id: string | null;
        ec_order_date: string;
        sum_price: number;
      };
      const umRes = await fetchAll<UnmatchedRow>(() =>
        supabase
          .from('ec_orders_unmatched')
          .select('id, ec_order_number, ec_member_id, ec_order_date, sum_price')
          .eq('resolved', false)
          .order('ec_order_date', { ascending: false })
          .order('id')
      );
      if (umRes.error) throw new Error(umRes.error);
      const umRows = umRes.data;
      const groupMap = new Map<string, UnmatchedGroup>();
      for (const r of umRows) {
        const key = r.ec_member_id ?? '(ゲスト)';
        const existing = groupMap.get(key);
        if (existing) {
          existing.order_count++;
          existing.total_yen += Number(r.sum_price ?? 0);
          if (r.ec_order_date > existing.latest_date) existing.latest_date = r.ec_order_date;
          if (r.ec_order_date < existing.earliest_date) existing.earliest_date = r.ec_order_date;
          if (existing.sample_order_numbers.length < 5) {
            existing.sample_order_numbers.push(r.ec_order_number);
          }
        } else {
          groupMap.set(key, {
            ec_member_id: r.ec_member_id,
            order_count: 1,
            total_yen: Number(r.sum_price ?? 0),
            earliest_date: r.ec_order_date,
            latest_date: r.ec_order_date,
            first_unmatched_id: r.id,
            sample_order_numbers: [r.ec_order_number],
          });
        }
      }
      const unmatchedGroups = Array.from(groupMap.values()).sort(
        (a, b) => b.total_yen - a.total_yen
      );

      // ③ 紐付け済み顧客
      const { data: linked, error: lkErr } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          branch_name,
          ec_member_id,
          ec_linked_at,
          assigned_ranger_id
        `)
        .not('ec_member_id', 'is', null)
        .is('deleted_at', null)
        .order('ec_linked_at', { ascending: false })
        .limit(200);
      if (lkErr) throw lkErr;

      type CustomerRow = {
        id: string;
        name: string;
        branch_name: string | null;
        ec_member_id: string;
        ec_linked_at: string;
        assigned_ranger_id: string | null;
      };
      const linkedRows = (linked ?? []) as CustomerRow[];

      // それぞれの EC 注文集計
      const linkedCustomers: LinkedCustomer[] = [];
      if (linkedRows.length > 0) {
        const customerIds = linkedRows.map((c) => c.id);
        const { data: ecOrders } = await supabase
          .from('orders')
          .select(`
            id,
            customer_id,
            total_amount_jpy
          `)
          .eq('source', 'ec')
          .in('customer_id', customerIds);

        type OrderRow = { id: string; customer_id: string; total_amount_jpy: number };
        const orderRows = (ecOrders ?? []) as OrderRow[];

        // 対応する commissions 取得
        const orderIds = orderRows.map((o) => o.id);
        const { data: orderItems } =
          orderIds.length > 0
            ? await supabase
                .from('order_items')
                .select('id, order_id, subtotal_jpy')
                .in('order_id', orderIds)
            : { data: [] };

        type ItemRow = { id: string; order_id: string; subtotal_jpy: number };
        const itemRows = (orderItems ?? []) as ItemRow[];
        const orderIdByItem = new Map<string, string>();
        for (const it of itemRows) orderIdByItem.set(it.id, it.order_id);

        const itemIds = itemRows.map((it) => it.id);
        const { data: commissionsRows } =
          itemIds.length > 0
            ? await supabase
                .from('commissions')
                .select('order_item_id, ranger_amount_jpy')
                .in('order_item_id', itemIds)
            : { data: [] };

        type CommissionRow = { order_item_id: string; ranger_amount_jpy: number };
        const commissions = (commissionsRows ?? []) as CommissionRow[];
        const commissionByOrder = new Map<string, number>();
        for (const c of commissions) {
          const orderId = orderIdByItem.get(c.order_item_id);
          if (!orderId) continue;
          commissionByOrder.set(
            orderId,
            (commissionByOrder.get(orderId) ?? 0) + Number(c.ranger_amount_jpy ?? 0)
          );
        }

        const byCustomer = new Map<
          string,
          { count: number; total_yen: number; commission_yen: number }
        >();
        for (const o of orderRows) {
          const cur = byCustomer.get(o.customer_id) ?? {
            count: 0,
            total_yen: 0,
            commission_yen: 0,
          };
          cur.count++;
          cur.total_yen += Number(o.total_amount_jpy ?? 0);
          cur.commission_yen += commissionByOrder.get(o.id) ?? 0;
          byCustomer.set(o.customer_id, cur);
        }

        // ranger 名取得
        const rangerIds = Array.from(
          new Set(linkedRows.map((r) => r.assigned_ranger_id).filter(Boolean))
        ) as string[];
        const { data: rangersRows } =
          rangerIds.length > 0
            ? await supabase.from('rangers').select('id, ranger_code').in('id', rangerIds)
            : { data: [] };
        type RangerRow = { id: string; ranger_code: string };
        const rangerMap = new Map<string, string>();
        for (const r of (rangersRows ?? []) as RangerRow[]) {
          rangerMap.set(r.id, r.ranger_code);
        }

        // profile 名
        const { data: profilesRows } =
          rangerIds.length > 0
            ? await supabase.from('profiles').select('id, display_name').in('id', rangerIds)
            : { data: [] };
        type ProfileRow = { id: string; display_name: string };
        const profileMap = new Map<string, string>();
        for (const p of (profilesRows ?? []) as ProfileRow[]) {
          profileMap.set(p.id, p.display_name);
        }

        for (const c of linkedRows) {
          const stats = byCustomer.get(c.id) ?? { count: 0, total_yen: 0, commission_yen: 0 };
          const rangerName = c.assigned_ranger_id
            ? profileMap.get(c.assigned_ranger_id) ?? rangerMap.get(c.assigned_ranger_id) ?? null
            : null;
          linkedCustomers.push({
            customer_id: c.id,
            customer_name: c.name,
            branch_name: c.branch_name,
            ec_member_id: c.ec_member_id,
            ec_linked_at: c.ec_linked_at,
            ranger_name: rangerName,
            ec_order_count: stats.count,
            ec_total_yen: stats.total_yen,
            ec_commission_yen: stats.commission_yen,
          });
        }
      }

      setData({
        lastSync,
        recentLogs,
        weekly,
        unmatchedGroups,
        linkedCustomers,
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}

/**
 * 未マッチキューの全エントリをひとつの顧客に紐付ける。
 * 同時に customers.ec_member_id を更新し、unmatched.resolved を一括で更新。
 */
export async function linkMemberIdToCustomer(
  ecMemberId: string,
  customerId: string,
): Promise<{ ok: boolean; error?: string; syncHint?: string }> {
  // customers.ec_member_id を更新
  const { error: updErr } = await supabase
    .from('customers')
    .update({ ec_member_id: ecMemberId, ec_linked_at: new Date().toISOString() })
    .eq('id', customerId);
  if (updErr) return { ok: false, error: updErr.message };

  // unmatched の該当分を delete（次回 sync で orders に昇格）
  const { error: delErr } = await supabase
    .from('ec_orders_unmatched')
    .delete()
    .eq('ec_member_id', ecMemberId)
    .eq('resolved', false);
  if (delErr) return { ok: false, error: delErr.message };

  return {
    ok: true,
    syncHint: '次回の同期で、この memberId の過去注文が orders に反映されます',
  };
}

/**
 * 紐付け解除
 */
export async function unlinkMemberId(customerId: string) {
  const { error } = await supabase
    .from('customers')
    .update({ ec_member_id: null, ec_linked_at: null })
    .eq('id', customerId);
  return { ok: !error, error: error?.message };
}

/**
 * 未マッチ注文を "直販扱い" として resolved=true にマーク
 */
export async function markAsDirectSale(ecMemberId: string) {
  const { error } = await supabase
    .from('ec_orders_unmatched')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('ec_member_id', ecMemberId)
    .eq('resolved', false);
  return { ok: !error, error: error?.message };
}
