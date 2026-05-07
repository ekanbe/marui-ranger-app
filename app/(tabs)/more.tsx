import { router } from 'expo-router';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { roleLabel } from '@/constants/labels';
import { Accent, Ink, Radius } from '@/constants/theme';
import { signOut, useAuth } from '@/hooks/use-auth';
import { useMyRanger } from '@/hooks/use-my-ranger';
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

type Item = { key: string; icon: string; label: string; sub: string; path: string; badge?: number };

export default function MoreScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const displayName = profile?.display_name ?? rangerProfile.name;
  const role = profile?.role ?? rangerProfile.rank;
  const email = profile?.email ?? session?.user.email ?? '';

  const { rows: notificationRows } = useNotifications(session);
  const unread = notificationRows.filter((n) => !n.read_at).length;
  const { ranger: myRanger } = useMyRanger(session);
  const displayRoleLabel =
    role === 'ranger' && myRanger?.ranger_number
      ? `レンジャー${myRanger.ranger_number}号`
      : roleLabel(role);

  const items: Item[] = [
    { key: 'notifications', icon: '🔔', label: '通知',           sub: '受注・達成・アラート',   path: '/notifications', badge: unread },
    { key: 'ranking',       icon: '🏆', label: 'ランク・実績',    sub: '月間ランキング / バッジ', path: '/ranking' },
    { key: 'showroom',      icon: '✨', label: 'ショールーム',    sub: '招待・来場管理',         path: '/showroom' },
  ];

  return (
    <Screen>
      <Text style={styles.title}>その他</Text>

      {/* プロフィールカード（タップで編集画面へ） */}
      <Pressable
        onPress={() => router.push('/profile-edit')}
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}
      >
        <Card variant="elevated" padding={18} style={{ marginBottom: 16 }}>
          <View style={styles.profile}>
            <Avatar name={displayName} imageUrl={profile?.avatar_url} size="lg" />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              {email ? <Text style={styles.email}>{email}</Text> : null}
              <View style={{ marginTop: 6 }}>
                <Badge label={displayRoleLabel} tone={role === 'admin' ? 'violet' : 'navy'} />
              </View>
            </View>
            <Text style={styles.editIcon}>✎</Text>
          </View>
        </Card>
      </Pressable>

      {/* メニュー */}
      <View style={{ gap: 10 }}>
        {items.map((i) => (
          <Pressable
            key={i.key}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(i.path as any)}
          >
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>{i.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{i.label}</Text>
              <Text style={styles.rowSub}>{i.sub}</Text>
            </View>
            {i.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{i.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </View>

      {/* 設定系 */}
      <Text style={styles.sectionHeader}>設定</Text>
      <View style={{ gap: 10 }}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/password-change' as any)}
        >
          <View style={styles.iconBox}><Text style={styles.iconText}>🔐</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>パスワード変更</Text>
            <Text style={styles.rowSub}>仮パスワードからご自身のものへ</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
        <View style={[styles.row, styles.disabledRow]}>
          <View style={styles.iconBox}><Text style={styles.iconText}>❓</Text></View>
          <Text style={styles.rowLabel}>ヘルプ</Text>
          <Text style={styles.rowSubSmall}>準備中</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
        >
          <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
            <Text style={styles.iconText}>🚪</Text>
          </View>
          <Text style={[styles.rowLabel, { color: Accent.red }]}>ログアウト</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>v1.9 · MARUI BUSSAN × RANGER</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], marginBottom: 16, letterSpacing: -0.3 },

  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 17, fontWeight: '800', color: Ink[900] },
  email: { fontSize: 11, color: Ink[500], marginTop: 2 },
  editIcon: { fontSize: 20, color: Ink[400] },

  sectionHeader: {
    fontSize: 11,
    color: Ink[500],
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Ink[100],
    gap: 12,
  },
  disabledRow: { opacity: 0.55, justifyContent: 'flex-start' },
  iconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Ink[100],
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: Ink[900] },
  rowSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  rowSubSmall: { fontSize: 11, color: Ink[400], marginLeft: 'auto' },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    minWidth: 22,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  arrow: { fontSize: 22, color: Ink[300], fontWeight: '300', marginLeft: 2 },

  version: { textAlign: 'center', color: Ink[400], fontSize: 10, letterSpacing: 1, marginTop: 24 },
});
