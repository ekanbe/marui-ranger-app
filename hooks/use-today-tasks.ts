import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type TodayTaskType = 'follow' | 'recommend' | 'showroom';
export type TodayTaskColor = 'red' | 'amber' | 'emerald';

export type TodayTask = {
  task_type: TodayTaskType;
  color: TodayTaskColor;
  entity_id: string;
  title: string;
  sub: string;
  link: string;
  sort_key: number;
};

export function useTodayTasks(session: Session | null) {
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      setTasks([]);
      setLoading(false);
      return;
    }
    let mounted = true;

    supabase
      .from('v_today_tasks')
      .select('task_type, color, entity_id, title, sub, link, sort_key')
      .eq('ranger_id', session.user.id)
      .order('sort_key', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.warn('[useTodayTasks]', error.message);
        setTasks((data as TodayTask[]) ?? []);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session]);

  return { tasks, loading };
}
