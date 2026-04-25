import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type ShowroomStatus = 'invited' | 'confirmed' | 'visited' | 'cancelled';

export type ShowroomItem = {
  id: string;
  scheduled_at: string | null;
  status: ShowroomStatus;
  customer_name: string;
  customer_image_url: string | null;
  memo: string | null;
  tasted_products: string[];
};

type NestedInvitation = {
  id: string;
  scheduled_at: string | null;
  status: ShowroomStatus;
  customers: { name: string | null; branch_name: string | null; image_url: string | null } | null;
  showroom_visits: {
    memo: string | null;
    tasted_products: string[] | null;
  }[] | null;
};

export function useShowroom(session: Session | null) {
  const [items, setItems] = useState<ShowroomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      setItems([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    (async () => {
      const [invitesRes, productsRes] = await Promise.all([
        supabase
          .from('showroom_invitations')
          .select(
            `id, scheduled_at, status,
             customers ( name, branch_name, image_url ),
             showroom_visits ( memo, tasted_products )`
          )
          .eq('ranger_id', session.user.id)
          .order('scheduled_at', { ascending: true }),
        supabase.from('products').select('id, name'),
      ]);

      if (!mounted) return;
      if (invitesRes.error) console.warn('[useShowroom invites]', invitesRes.error.message);
      if (productsRes.error) console.warn('[useShowroom products]', productsRes.error.message);

      const productMap = new Map<string, string>(
        ((productsRes.data ?? []) as { id: string; name: string }[]).map((p) => [p.id, p.name])
      );

      const result: ShowroomItem[] = ((invitesRes.data ?? []) as unknown as NestedInvitation[]).map((inv) => {
        const cust = inv.customers;
        const visit = inv.showroom_visits?.[0] ?? null;
        const tastedIds = visit?.tasted_products ?? [];
        const tastedNames = tastedIds.map((id) => productMap.get(id) ?? '-').filter((n) => n !== '-');
        return {
          id: inv.id,
          scheduled_at: inv.scheduled_at,
          status: inv.status,
          customer_name: [cust?.name, cust?.branch_name].filter(Boolean).join(' ') || '-',
          customer_image_url: cust?.image_url ?? null,
          memo: visit?.memo ?? null,
          tasted_products: tastedNames,
        };
      });

      setItems(result);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [session, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);
  return { items, loading, reload };
}
