import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { SalesPhase } from '@/lib/sales-phase';

export type CustomerRow = {
  id: string;
  name: string;
  branch_name: string | null;
  address: string | null;
  business_type: string | null;
  status: string;
  image_url: string | null;
  last_ordered_at: string | null;
  sales_phase: SalesPhase | null;
  acquired_by_ranger_id: string | null;
};

export type DerivedStatus = 'good' | 'stall' | 'follow';

/**
 * 最終発注日から表示用ステータスを算出する。
 * 将来 customers.status に 'good'/'stall'/'follow' を格納する場合はそちらを優先する。
 */
export function deriveStatus(lastOrderedAt: string | null | undefined): DerivedStatus {
  if (!lastOrderedAt) return 'follow';
  const days = Math.floor((Date.now() - new Date(lastOrderedAt).getTime()) / 86400000);
  if (days >= 30) return 'follow';
  if (days >= 14) return 'stall';
  return 'good';
}

export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('customers')
      .select(
        'id, name, branch_name, address, business_type, status, image_url, last_ordered_at, sales_phase, acquired_by_ranger_id'
      )
      .order('last_ordered_at', { ascending: false, nullsFirst: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.warn('[useCustomers]', error.message);
          setError(error.message);
        }
        setCustomers((data as CustomerRow[]) ?? []);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { customers, loading, error };
}
