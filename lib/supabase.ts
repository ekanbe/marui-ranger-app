import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

const extra = Constants.expoConfig?.extra ?? {};
const SUPABASE_URL = (extra.supabaseUrl as string | undefined) ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = (extra.supabaseAnonKey as string | undefined) ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Web では SSR 時に window が無いので、安全に localStorage を触るラッパーを使う。
// ネイティブでは AsyncStorage をそのまま使う。
const webStorage = {
  getItem: async (key: string): Promise<string | null> =>
    typeof window !== 'undefined' ? window.localStorage.getItem(key) : null,
  setItem: async (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key);
  },
};

const storage = Platform.OS === 'web' ? webStorage : AsyncStorage;

export const supabase = createClient(
  SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY || 'public-anon-key-placeholder',
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// ネイティブではバックグラウンド中のトークン自動更新が動かないため、
// AppState と連携してフォアグラウンド時のみ autoRefresh を回す（Supabase 公式推奨パターン）。
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

// PostgREST は 1 クエリ最大 1000 行しか返さないため、
// 集計目的の全件取得は .range() で 1000 件ずつページングして繋ぐ。
// buildQuery は毎ページ新しいクエリビルダーを返すこと（order 付き推奨）。
const FETCH_ALL_PAGE_SIZE = 1000;

type RangeQuery = {
  range: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
};

export async function fetchAll<T>(
  buildQuery: () => RangeQuery,
): Promise<{ data: T[]; error: string | null }> {
  const rows: T[] = [];
  for (let from = 0; ; from += FETCH_ALL_PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + FETCH_ALL_PAGE_SIZE - 1);
    if (error) return { data: rows, error: error.message };
    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < FETCH_ALL_PAGE_SIZE) break;
  }
  return { data: rows, error: null };
}
