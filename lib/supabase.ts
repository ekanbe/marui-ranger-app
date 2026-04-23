import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
