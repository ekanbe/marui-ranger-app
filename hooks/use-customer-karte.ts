import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

// 旧・個人店特化の型（DB互換のため残置。UIからは非表示）
export type FreezerCapacity = 'small' | 'medium' | 'large';
export type KitchenSize = 'small' | 'medium' | 'large';
export type CustomerSegment = 'family' | 'business' | 'tourist' | 'student' | 'senior' | 'mixed';

// 新・企業概要カルテの選択肢型
export type OperationType = 'direct' | 'fc' | 'mixed';
export type ListingStatus = 'listed' | 'private' | 'unknown';
export type PaymentMethod = 'bank' | 'tegata' | 'densai' | 'other';
export type OrderStyle = 'hq' | 'store' | 'center' | 'mixed';
export type DeliveryStyle = 'own_center' | 'shared_center' | 'direct' | 'unknown';

export type CustomerKarte = {
  customer_id: string;

  // ── 企業概要 ──
  store_count: number | null;
  operation_type: OperationType | null;
  area_note: string | null;
  annual_revenue_note: string | null;
  listing_status: ListingStatus | null;

  // ── 取引条件（与信・支払い） ──
  payment_terms: string | null;
  payment_method: PaymentMethod | null;
  credit_score: number | null;
  credit_limit_yen: number | null;

  // ── 商流・意思決定 ──
  order_style: OrderStyle | null;
  delivery_style: DeliveryStyle | null;
  decision_maker: string | null;
  competitor_supplier: string | null;

  // ── 商品・提案 ──
  signature_dish: string | null;
  target_segments: CustomerSegment[];
  needs_note: string | null;

  // ── メモ ──
  free_note: string | null;

  // ── 旧・個人店特化（DB互換のため保持。UI非表示） ──
  has_fryer: boolean | null;
  has_convection_oven: boolean | null;
  freezer_capacity: FreezerCapacity | null;
  kitchen_size: KitchenSize | null;
  staff_count: number | null;
  peak_hours: string | null;
  avg_serve_minutes: number | null;
  avg_check_yen: number | null;
  seasonal_menu_note: string | null;
  customer_segment: CustomerSegment | null;
  repeat_rate_note: string | null;

  updated_by: string | null;
  updated_at: string | null;
};

// 編集画面が扱う新カルテの入力（旧カラムは触らない）
export type CustomerKarteInput = {
  customer_id: string;
  store_count: number | null;
  operation_type: OperationType | null;
  area_note: string | null;
  annual_revenue_note: string | null;
  listing_status: ListingStatus | null;
  payment_terms: string | null;
  payment_method: PaymentMethod | null;
  credit_score: number | null;
  credit_limit_yen: number | null;
  order_style: OrderStyle | null;
  delivery_style: DeliveryStyle | null;
  decision_maker: string | null;
  competitor_supplier: string | null;
  signature_dish: string | null;
  target_segments: CustomerSegment[];
  needs_note: string | null;
  free_note: string | null;
};

export function useCustomerKarte(customerId: string | undefined) {
  const [karte, setKarte] = useState<CustomerKarte | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!customerId) {
      setLoading(false);
      setKarte(null);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_kartes')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (!mounted) return;
      if (error) console.warn('[useCustomerKarte]', error.message);
      setKarte((data as CustomerKarte | null) ?? null);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [customerId, reloadKey]);

  return {
    karte,
    loading,
    reload: () => setReloadKey((k) => k + 1),
  };
}

export async function saveCustomerKarte(input: CustomerKarteInput, rangerId: string | null) {
  const payload = {
    ...input,
    updated_by: rangerId,
  };
  const { error } = await supabase
    .from('customer_kartes')
    .upsert(payload, { onConflict: 'customer_id' });
  if (error) throw error;
}
