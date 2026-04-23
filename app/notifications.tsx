import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications, type NotificationType } from '@/hooks/use-notifications';

const TYPE_COLOR: Record<NotificationType, string> = {
  order: Brand.navy,
  achievement: Accent.emerald,
  alert: Accent.red,
  recommend: Brand.gold,
  progress: Accent.amber,
};

const TYPE_ICON: Record<NotificationType, string> = {
  order: '▣',
  achievement: '★',
  alert: '!',
  recommend: '◎',
  progress: '↗',
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const { rows, loading } = useNotifications(session);
  const unreadCount = rows.filter((n) => !n.read_at).length;

  return (
    <Screen>
      <Text style={styles.title}>通知</Text>
      <Text style={styles.sub}>未読 {unreadCount} 件</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      ) : rows.length === 0 ? (
        <Text style={styles.empty}>通知はありません</Text>
      ) : (
        <View style={{ gap: 10, marginTop: 16 }}>
          {rows.map((n) => {
            const unread = !n.read_at;
            return (
              <View key={n.id} style={[styles.card, unread && styles.unread]}>
                <View style={[styles.icon, { backgroundColor: TYPE_COLOR[n.type] }]}>
                  <Text style={styles.iconText}>{TYPE_ICON[n.type]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nTitle}>{n.title}</Text>
                  {n.body && <Text style={styles.nBody}>{n.body}</Text>}
                  <Text style={styles.nTime}>{fmt(n.created_at)}</Text>
                </View>
                {unread && <View style={styles.unreadDot} />}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },

  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  empty: { paddingVertical: 48, textAlign: 'center', color: Ink[500], fontSize: 13 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  unread: { borderColor: Brand.navy, borderWidth: 1.5 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#fff', fontWeight: '800' },
  nTitle: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  nBody: { fontSize: 12, color: Ink[700], marginTop: 4 },
  nTime: { fontSize: 10, color: Ink[500], marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Accent.red, marginTop: 6 },
});
