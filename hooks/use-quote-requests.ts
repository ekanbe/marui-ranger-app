import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type QuoteRequestStatus = 'pending' | 'approved' | 'rejected' | 'registered' | 'cancelled';

export type QuoteRequest = {
  id: string;
  customer_id: string;
  customer_name: string;
  ranger_id: string;
  ranger_name: string | null;
  product_id: string;
  product_name: string;
  product_set_id: string | null;
  quantity: number;
  standard_price_jpy: number | null;
  requested_price_jpy: number;
  reason: string | null;
  status: QuoteRequestStatus;
  admin_note: string | null;
  approved_at: string | null;
  bcart_estimate_id: string | null;
  bcart_estimate_code: string | null;
  created_at: string;
};

type Scope = { rangerId: string | null; isAdmin: boolean };

export function useQuoteRequests(scope: Scope) {
  const [rows, setRows] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { rangerId, isAdmin } = scope;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('quote_requests')
        .select(
          `id, customer_id, ranger_id, product_id, product_set_id,
           quantity, standard_price_jpy, requested_price_jpy, reason,
           status, admin_note, approved_at, bcart_estimate_id, bcart_estimate_code, created_at,
           customers ( name ),
           products ( name )`,
        )
        .order('created_at', { ascending: false });

      if (!isAdmin && rangerId) {
        query = query.eq('ranger_id', rangerId);
      }

      const { data, error: qerr } = await query;
      if (qerr) throw qerr;

      type Raw = {
        id: string;
        customer_id: string;
        ranger_id: string;
        product_id: string;
        product_set_id: string | null;
        quantity: number;
        standard_price_jpy: number | null;
        requested_price_jpy: number;
        reason: string | null;
        status: QuoteRequestStatus;
        admin_note: string | null;
        approved_at: string | null;
        bcart_estimate_id: string | null;
        bcart_estimate_code: string | null;
        created_at: string;
        customers: { name: string } | null;
        products: { name: string } | null;
      };

      const rawList = (data ?? []) as unknown as Raw[];

      // ranger 名を別 SELECT で取得して付与
      const rangerIds = Array.from(new Set(rawList.map((r) => r.ranger_id)));
      const rangerNameMap = new Map<string, string>();
      if (rangerIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', rangerIds);
        for (const p of (profs ?? []) as { id: string; display_name: string | null }[]) {
          if (p.display_name) rangerNameMap.set(p.id, p.display_name);
        }
      }

      const mapped: QuoteRequest[] = rawList.map((r) => ({
        id: r.id,
        customer_id: r.customer_id,
        customer_name: r.customers?.name ?? '(不明顧客)',
        ranger_id: r.ranger_id,
        ranger_name: rangerNameMap.get(r.ranger_id) ?? null,
        product_id: r.product_id,
        product_name: r.products?.name ?? '(不明商品)',
        product_set_id: r.product_set_id,
        quantity: r.quantity,
        standard_price_jpy: r.standard_price_jpy,
        requested_price_jpy: r.requested_price_jpy,
        reason: r.reason,
        status: r.status,
        admin_note: r.admin_note,
        approved_at: r.approved_at,
        bcart_estimate_id: r.bcart_estimate_id,
        bcart_estimate_code: r.bcart_estimate_code,
        created_at: r.created_at,
      }));

      setRows(mapped);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [rangerId, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, error, reload: load };
}

/**
 * 見積依頼起票
 */
export async function createQuoteRequest(input: {
  tenant_id: string;
  customer_id: string;
  ranger_id: string;
  product_id: string;
  product_set_id?: string | null;
  quantity: number;
  standard_price_jpy?: number | null;
  requested_price_jpy: number;
  reason?: string;
}) {
  const { data, error } = await supabase
    .from('quote_requests')
    .insert({ ...input, status: 'pending' })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id as string };
}

/**
 * admin 承認
 */
export async function approveQuoteRequest(id: string, adminNote?: string) {
  const { error } = await supabase
    .from('quote_requests')
    .update({
      status: 'approved',
      admin_note: adminNote ?? null,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id);
  return { ok: !error, error: error?.message };
}

/**
 * admin 差戻し
 */
export async function rejectQuoteRequest(id: string, adminNote: string) {
  const { error } = await supabase
    .from('quote_requests')
    .update({
      status: 'rejected',
      admin_note: adminNote,
    })
    .eq('id', id);
  return { ok: !error, error: error?.message };
}

/**
 * admin 登録完了 (Bカートで見積登録した後)
 */
export async function markQuoteRequestRegistered(id: string, bcartEstimateId: string, bcartEstimateCode?: string) {
  const { error } = await supabase
    .from('quote_requests')
    .update({
      status: 'registered',
      bcart_estimate_id: bcartEstimateId,
      bcart_estimate_code: bcartEstimateCode ?? null,
    })
    .eq('id', id);
  return { ok: !error, error: error?.message };
}
