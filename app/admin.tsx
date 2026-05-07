import { Redirect } from 'expo-router';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

/**
 * 管理者ダッシュボードへの入口URL `/admin`。
 *
 * 動作：
 *  - 未ログイン → /login へ
 *  - admin + Web   → /(tabs) へ（_layout の AuthGate が AdminShell + AdminDashboard を出す）
 *  - admin + iOS/Android → 「PCブラウザで開いてください」案内
 *  - ranger        → 権限なし案内（その後 / へ）
 */
export default function AdminEntry() {
  const { session, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(session);

  if (loading || (session && profileLoading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Brand.navy} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (profile?.role !== 'admin') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>管理者権限がありません</Text>
        <Text style={styles.body}>
          このページは管理者専用です。
          通常のレンジャー画面にお戻りください。
        </Text>
        <Redirect href="/(tabs)" />
      </View>
    );
  }

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>PCブラウザで開いてください</Text>
        <Text style={styles.body}>
          管理機能はPCのブラウザ版でのみご利用いただけます。{'\n'}
          下記URLをPCで開いてログインしてください。{'\n\n'}
          https://ekanbe.github.io/marui-ranger-app/admin
        </Text>
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAF7F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Brand.navy,
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 400,
  },
});
