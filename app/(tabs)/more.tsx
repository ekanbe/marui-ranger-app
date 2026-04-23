import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Brand, Ink, Radius } from '@/constants/theme';
import { signOut, useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { useProfile } from '@/hooks/use-profile';
import { rangerProfile } from '@/lib/mockData';

function handleLogout() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm('ログアウトしますか？')) {
      signOut();
    }
    return;
  }
  Alert.alert('ログアウト', 'ログアウトしますか？', [
    { text: 'キャンセル', style: 'cancel' },
    { text: 'ログアウト', style: 'destructive', onPress: () => { signOut(); } },
  ]);
}

type Item = { key: string; label: string; sub: string; path: string; badge?: number };

export default function MoreScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const displayName = profile?.display_name ?? rangerProfile.name;
  const avatarInitial = displayName.charAt(0);
  const role = profile?.role ?? rangerProfile.rank;
  const email = profile?.email ?? session?.user.email ?? '';

  const { rows: notificationRows } = useNotifications(session);
  const unread = notificationRows.filter((n) => !n.read_at).length;
  const items: Item[] = [
    { key: 'notifications', label: '通知',             sub: '受注・達成・アラート',   path: '/notifications', badge: unread },
    { key: 'ranking',       label: 'ランク・実績',      sub: '月間ランキング / バッジ', path: '/ranking' },
    { key: 'showroom',      label: 'ショールーム',      sub: '招待・来場管理',         path: '/showroom' },
  ];

  return (
    <Screen>
      <Text style={styles.title}>その他</Text>

      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{avatarInitial}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.code}>{email ? `${email}・` : ''}{role.toUpperCase()}</Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {items.map(i => (
          <Pressable key={i.key} style={styles.row} onPress={() => router.push(i.path as any)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{i.label}</Text>
              <Text style={styles.rowSub}>{i.sub}</Text>
            </View>
            {i.badge ? <View style={styles.badge}><Text style={styles.badgeText}>{i.badge}</Text></View> : null}
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 24, gap: 10 }}>
        <Pressable style={[styles.row, styles.disabledRow]}>
          <Text style={styles.rowLabel}>設定</Text>
          <Text style={styles.rowSubSmall}>準備中</Text>
        </Pressable>
        <Pressable style={[styles.row, styles.disabledRow]}>
          <Text style={styles.rowLabel}>ヘルプ</Text>
          <Text style={styles.rowSubSmall}>準備中</Text>
        </Pressable>
        <Pressable style={styles.row} onPress={handleLogout}>
          <Text style={[styles.rowLabel, { color: '#EF4444' }]}>ログアウト</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], marginBottom: 16 },

  profile: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: Radius.lg, padding: 18,
    borderWidth: 1, borderColor: Ink[100], marginBottom: 16,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Brand.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  name: { fontSize: 16, fontWeight: '700', color: Ink[900] },
  code: { fontSize: 11, color: Ink[500], marginTop: 2 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: Radius.md, padding: 16,
    borderWidth: 1, borderColor: Ink[100], gap: 10,
  },
  disabledRow: { opacity: 0.55, justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, fontWeight: '600', color: Ink[900] },
  rowSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  rowSubSmall: { fontSize: 11, color: Ink[500] },
  badge: { backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, minWidth: 22, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  arrow: { fontSize: 20, color: Ink[300] },
});
