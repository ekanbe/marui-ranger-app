import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type FreezerCapacity = 'small' | 'medium' | 'large';
export type KitchenSize = 'small' | 'medium' | 'large';
export type CustomerSegment = 'family' | 'business' | 'tourist' | 'student' | 'senior' | 'mixed';

export type CustomerKarte = {
  customer_id: string;
  has_fryer: boolean | null;
  has_convection_oven: boolean | null;
  freezer_capacity: FreezerCapacity | null;
  kitchen_size: KitchenSize | null;
  staff_count: number | null;
  peak_hours: string | null;
  avg_serve_minutes: number | null;
  avg_check_yen: number | null;
  signature_dish: string | null;
  seasonal_menu_note: string | null;
  customer_segment: CustomerSegment | null;
  repeat_rate_note: string | null;
  free_note: string | null;
  updated_by: string | null;
  updated_at: string | null;
};

export type CustomerKarteInput = Omit<CustomerKarte, 'updated_by' | 'updated_at'>;

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
