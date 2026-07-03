import { useCallback, useEffect, useState } from 'react';

import { fetchAll, supabase } from '@/lib/supabase';

export type BcartSyncLog = {
  id: string;
  sync_started_at: string;
  sync_ended_at: string | null;
  sync_kind: 'orders' | 'customers' | 'products' | 'price_groups';
  fetch_from: string | null;
  fetch_to: string | null;
  records_fetched: number;
  records_matched: number;
  records_unmatched: number;
  records_upserted: number;
  records_duplicated: number;
  status: 'running' | 'success' | 'failed';
  error_message: string | null;
};

export type BcartUnmatchedOrder = {
  id: string;
  bcart_order_id: string;
  bcart_order_code: string | null;
  bcart_customer_id: string | null;
  bcart_comp_name: string | null;
  ordered_at: string;
  total_price: number;
  final_price: number | null;
  bcart_status: string | null;
  created_at: string;
};

export type BcartLinkedCustomer = {
  customer_id: string;
  customer_name: string;
  branch_name: string | null;
  bcart_customer_id: string;
  bcart_comp_name: string | null;
  bcart_linked_at: string;
  ranger_name: string | null;
  bcart_order_count: number;
  bcart_total_yen: number;
};

export type BcartSyncData = {
  lastOrdersSync: BcartSyncLog | null;
  recentLogs: BcartSyncLog[];
  weekly: { fetched: number; matched: number; unmatched: number };
  unmatched: BcartUnmatchedOrder[];
  linkedCustomers: BcartLinkedCustomer[];
};

export function useBcartSync() {
  const [data, setData] = useState<BcartSyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // ① 同期ログ（直近20件 = 各kind数件ずつ）
      const { data: logs, error: logsErr } = await supabase
        .from('bcart_sync_log')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(20);
      if (logsErr) throw logsErr;
      const recentLogs = (logs ?? []) as BcartSyncLog[];
      const lastOrdersSync = recentLogs.find((l) => l.sync_kind === 'orders') ?? null;

      // 直近7日のサマリ（ordersのみ）
      // 直近20件では数時間分しか拾えないため、7日分の専用クエリで集計する。
      // 10分間隔 cron だと 7日で 1000 行を超えるので fetchAll でページング取得。
      const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const weeklyRes = await fetchAll<{
        records_fetched: number | null;
        records_matched: number | null;
        records_unmatched: number | null;
      }>(() =>
        supabase
          .from('bcart_sync_log')
          .select('records_fetched, records_matched, records_unmatched')
          .eq('sync_kind', 'orders')
          .eq('status', 'success')
          .gte('sync_started_at', sevenDaysAgo)
          .order('sync_started_at', { ascending: false })
          .order('id'),
      );
      if (weeklyRes.error) throw new Error(weeklyRes.error);
      const weekly = weeklyRes.data.reduce(
        (acc, l) => ({
          fetched: acc.fetched + (l.records_fetched ?? 0),
          matched: acc.matched + (l.records_matched ?? 0),
          unmatched: acc.unmatched + (l.records_unmatched ?? 0),
        }),
        { fetched: 0, matched: 0, unmatched: 0 },
      );

      // ② 未マッチ受注一覧
      const { data: unmatchedRows, error: umErr } = await supabase
        .from('bcart_orders_unmatched')
        .select(
          'id, bcart_order_id, bcart_order_code, bcart_customer_id, bcart_comp_name, ordered_at, total_price, final_price, bcart_status, created_at',
        )
        .eq('resolved', false)
        .order('ordered_at', { ascending: false })
        .limit(200);
      if (umErr) throw umErr;
      const unmatched = (unmatchedRows ?? []) as BcartUnmatchedOrder[];

      // ③ 紐付け済み顧客
      const { data: linked, error: lkErr } = await supabase
        .from('customers')
        .select(
          'id, name, branch_name, bcart_customer_id, bcart_comp_name, bcart_linked_at, assigned_ranger_id',
        )
        .not('bcart_customer_id', 'is', null)
        .is('deleted_at', null)
        .order('bcart_linked_at', { ascending: false })
        .limit(200);
      if (lkErr) throw lkErr;

      type CustomerRow = {
        id: string;
        name: string;
        branch_name: string | null;
        bcart_customer_id: string;
        bcart_comp_name: string | null;
        bcart_linked_at: string;
        assigned_ranger_id: string | null;
      };
      const linkedRows = (linked ?? []) as CustomerRow[];

      const linkedCustomers: BcartLinkedCustomer[] = [];
      if (linkedRows.length > 0) {
        const customerIds = linkedRows.map((c) => c.id);
        const { data: bcOrders } = await supabase
          .from('orders')
          .select('id, customer_id, total_amount_jpy')
          .eq('source', 'bcart')
          .in('customer_id', customerIds);

        type OrderRow = { id: string; customer_id: string; total_amount_jpy: number };
        const orderRows = (bcOrders ?? []) as OrderRow[];

        const byCustomer = new Map<string, { count: number; total: number }>();
        for (const o of orderRows) {
          const cur = byCustomer.get(o.customer_id) ?? { count: 0, total: 0 };
          cur.count++;
          cur.total += Number(o.total_amount_jpy ?? 0);
          byCustomer.set(o.customer_id, cur);
        }

        // ranger 名取得
        const rangerIds = Array.from(
          new Set(linkedRows.map((r) => r.assigned_ranger_id).filter(Boolean)),
        ) as string[];
        const { data: profilesRows } =
          rangerIds.length > 0
            ? await supabase
                .from('profiles')
                .select('id, display_name')
                .in('id', rangerIds)
            : { data: [] };
        type ProfileRow = { id: string; display_name: string };
        const profileMap = new Map<string, string>();
        for (const p of (profilesRows ?? []) as ProfileRow[]) {
          profileMap.set(p.id, p.display_name);
        }

        for (const c of linkedRows) {
          const stats = byCustomer.get(c.id) ?? { count: 0, total: 0 };
          linkedCustomers.push({
            customer_id: c.id,
            customer_name: c.name,
            branch_name: c.branch_name,
            bcart_customer_id: c.bcart_customer_id,
            bcart_comp_name: c.bcart_comp_name,
            bcart_linked_at: c.bcart_linked_at,
            ranger_name: c.assigned_ranger_id
              ? profileMap.get(c.assigned_ranger_id) ?? null
              : null,
            bcart_order_count: stats.count,
            bcart_total_yen: stats.total,
          });
        }
      }

      setData({
        lastOrdersSync,
        recentLogs,
        weekly,
        unmatched,
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
 * 未マッチ受注を顧客に紐付け（既存RPCを呼ぶ）
 *   - orders/order_items を作成
 *   - customers.bcart_customer_id を自動補填
 *   - bcart_orders_unmatched.resolved = true
 */
export async function resolveUnmatchedBcartOrder(
  unmatchedId: string,
  customerId: string,
): Promise<{ ok: boolean; orderId?: string; error?: string }> {
  const { data, error } = await supabase.rpc('fn_resolve_unmatched_bcart_order', {
    p_unmatched_id: unmatchedId,
    p_customer_id: customerId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, orderId: data as string };
}

/**
 * Bカート紐付け解除（過去のorders/commissionsは残す）
 */
export async function unlinkBcartCustomer(customerId: string) {
  const { error } = await supabase
    .from('customers')
    .update({
      bcart_customer_id: null,
      bcart_comp_name: null,
      bcart_email: null,
      bcart_price_group_id: null,
      bcart_linked_at: null,
    })
    .eq('id', customerId);
  return { ok: !error, error: error?.message };
}
