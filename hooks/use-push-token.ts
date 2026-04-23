import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/**
 * ログイン済みセッションからExpo push tokenを取得して push_tokens に保存する。
 * - Web では何もしない（実機アプリのみ対象）
 * - 権限拒否時はサイレントに失敗
 * - push_tokens テーブルが無い環境ではエラーログのみ（マイグレーション未適用でも落ちない）
 */
export function usePushToken(session: Session | null) {
  useEffect(() => {
    if (!session) return;
    if (Platform.OS === 'web') return;
    if (!Device.isDevice) return;

    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const tokenResult = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        const expoToken = tokenResult.data;

        const { error } = await supabase.from('push_tokens').upsert(
          {
            ranger_id: session.user.id,
            expo_token: expoToken,
            platform: Platform.OS,
            device_name: Device.modelName ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'ranger_id,expo_token' }
        );

        if (error) console.warn('[usePushToken]', error.message);
      } catch (e) {
        console.warn('[usePushToken] exception:', (e as Error).message);
      }
    })();
  }, [session]);
}
