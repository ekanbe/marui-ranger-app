import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

// 顧客が「フォロー対象外」(snoozed_until=infinity 相当の恒久除外)かどうかを返し、
// 解除(follow_dismissals 行の削除)を提供する。
// 14日スヌーズ(数週間先)とは区別し、1年より先/infinity のみ「対象外」とみなす。
export function useFollowDismissal(customerId: string | undefined) {
  const { session } = useAuth();
  const [excluded, setExcluded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!customerId || !session) {
      setLoading(false);
      setExcluded(false);
      return;
    }
    let mounted = true;

    (async () => {
      setLoading(true);
      const [{ data, error }, { data: cust }] = await Promise.all([
        supabase
          .from('follow_dismissals')
          .select('snoozed_until, created_at')
          .eq('ranger_id', session.user.id)
          .eq('customer_id', customerId)
          .maybeSingle(),
        supabase.from('customers').select('last_ordered_at').eq('id', customerId).maybeSingle(),
      ]);

      if (!mounted) return;
      if (error) console.warn('[useFollowDismissal]', error.message);
      const su = data?.snoozed_until as string | undefined;
      const isInfinite =
        !!su &&
        (String(su).startsWith('infinity') ||
          new Date(su).getTime() - Date.now() > 365 * 86400000);
      // 対象化後に発注があれば view 側で自動復活しているので「対象外」とは表示しない
      const lastOrdered = cust?.last_ordered_at as string | undefined;
      const stillActive =
        !lastOrdered ||
        !data?.created_at ||
        new Date(data.created_at).getTime() > new Date(lastOrdered).getTime();
      setExcluded(isInfinite && stillActive);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [customerId, session, reloadKey]);

  const clear = useCallback(async () => {
    if (!customerId || !session) return { ok: false, error: '未ログイン' };
    const { error } = await supabase
      .from('follow_dismissals')
      .delete()
      .eq('ranger_id', session.user.id)
      .eq('customer_id', customerId);
    if (!error) setReloadKey((k) => k + 1);
    return { ok: !error, error: error?.message ?? null };
  }, [customerId, session]);

  return { excluded, loading, clear, reload: () => setReloadKey((k) => k + 1) };
}
