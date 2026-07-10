import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type TodayTaskType = 'follow' | 'recommend' | 'showroom' | 'custom';
export type TodayTaskColor = 'red' | 'amber' | 'emerald' | 'navy';

export type TodayTask = {
  id: string | null; // custom タスクの場合、削除/完了に使う custom_today_tasks.id
  task_type: TodayTaskType;
  color: TodayTaskColor;
  entity_id: string;
  customer_id: string | null;
  title: string;
  sub: string;
  link: string;
  sort_key: number;
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useTodayTasks(session: Session | null) {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!session) {
      setTasks([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);

    Promise.all([
      supabase
        .from('v_today_tasks')
        .select('task_type, color, entity_id, title, sub, link, sort_key, customer_id')
        .eq('ranger_id', session.user.id)
        .order('sort_key', { ascending: true }),
      supabase
        .from('custom_today_tasks')
        .select('id, customer_id, title, note, created_at, customers ( name, branch_name )')
        .eq('ranger_id', session.user.id)
        .eq('target_date', todayStr())
        .is('done_at', null)
        .order('created_at', { ascending: true }),
    ]).then(([autoRes, customRes]) => {
      if (!mounted) return;
      if (autoRes.error) console.warn('[useTodayTasks]', autoRes.error.message);
      if (customRes.error) console.warn('[useTodayTasks:custom]', customRes.error.message);

      const auto: TodayTask[] = ((autoRes.data as any[]) ?? []).map((t) => ({
        id: null,
        task_type: t.task_type,
        color: t.color,
        entity_id: t.entity_id,
        customer_id: t.customer_id ?? null,
        title: t.title,
        sub: t.sub,
        link: t.link,
        sort_key: t.sort_key,
      }));

      const custom: TodayTask[] = ((customRes.data as any[]) ?? []).map((t) => {
        const c = t.customers as { name: string; branch_name: string | null } | null;
        return {
          id: t.id,
          task_type: 'custom' as const,
          color: 'navy' as const,
          entity_id: t.customer_id ?? t.id,
          customer_id: t.customer_id,
          title: t.title,
          sub: t.note ?? (c ? `${c.name}${c.branch_name ? ` ${c.branch_name}` : ''}` : '自分で追加したタスク'),
          link: 'custom',
          sort_key: 0, // follow(1)より前・最優先で表示
        };
      });

      setTasks([...custom, ...auto].sort((a, b) => a.sort_key - b.sort_key));
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [session, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const addCustomTask = useCallback(
    async (params: {
      customerId?: string | null;
      title: string;
      note?: string | null;
      day?: 'today' | 'tomorrow';
    }) => {
      if (!session) return { ok: false, error: '未ログイン' };
      const { data: tenant } = await supabase.from('tenants').select('id').limit(1).maybeSingle();
      if (!tenant) return { ok: false, error: 'tenant_id が取得できません' };
      // 前日の夜に「明日やること」として仕込める(松永さんFB 2026-07-10)
      const target = new Date();
      if (params.day === 'tomorrow') target.setDate(target.getDate() + 1);
      const targetDate = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
      const { error } = await supabase.from('custom_today_tasks').insert({
        tenant_id: tenant.id,
        ranger_id: session.user.id,
        customer_id: params.customerId ?? null,
        title: params.title,
        note: params.note ?? null,
        target_date: targetDate,
      });
      if (error) return { ok: false, error: error.message };
      reload();
      return { ok: true, error: null };
    },
    [session, reload]
  );

  const removeCustomTask = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('custom_today_tasks').delete().eq('id', id);
      if (!error) reload();
      return { ok: !error, error: error?.message ?? null };
    },
    [reload]
  );

  const completeCustomTask = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('custom_today_tasks')
        .update({ done_at: new Date().toISOString() })
        .eq('id', id);
      if (!error) reload();
      return { ok: !error, error: error?.message ?? null };
    },
    [reload]
  );

  // フォロー提案は実発注データからの自動生成のため「完了」= 14日間スヌーズ(停滞判定と同じ閾値)
  const dismissFollowTask = useCallback(
    async (customerId: string) => {
      if (!session) return { ok: false, error: '未ログイン' };
      const snoozedUntil = new Date(Date.now() + 14 * 86400000).toISOString();
      const { error } = await supabase
        .from('follow_dismissals')
        .upsert(
          {
            ranger_id: session.user.id,
            customer_id: customerId,
            snoozed_until: snoozedUntil,
            created_at: new Date().toISOString(), // 対象化時刻を更新(発注による自動復活の基準)
          },
          { onConflict: 'ranger_id,customer_id' }
        );
      if (!error) reload();
      return { ok: !error, error: error?.message ?? null };
    },
    [session, reload]
  );

  // 「もう追わない」顧客をフォロー提案から無期限で外す（snoozed_until = infinity）。
  // 顧客一覧には残る。解除は follow_dismissals の行を削除すれば戻る。
  const excludeFollowTask = useCallback(
    async (customerId: string) => {
      if (!session) return { ok: false, error: '未ログイン' };
      const { error } = await supabase
        .from('follow_dismissals')
        .upsert(
          {
            ranger_id: session.user.id,
            customer_id: customerId,
            snoozed_until: 'infinity',
            created_at: new Date().toISOString(), // 対象化時刻を更新(発注による自動復活の基準)
          },
          { onConflict: 'ranger_id,customer_id' }
        );
      if (!error) reload();
      return { ok: !error, error: error?.message ?? null };
    },
    [session, reload]
  );

  return {
    tasks,
    loading,
    reload,
    addCustomTask,
    removeCustomTask,
    completeCustomTask,
    dismissFollowTask,
    excludeFollowTask,
  };
}
