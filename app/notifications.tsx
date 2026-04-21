import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { notifications } from '@/lib/mockData';

const TYPE_COLOR = {
  order:       Brand.navy,
  achievement: Accent.emerald,
  alert:       Accent.red,
  recommend:   Brand.gold,
  progress:    Accent.amber,
} as const;

const TYPE_ICON = {
  order: '▣', achievement: '★', alert: '!', recommend: '◎', progress: '↗',
} as const;

export default function NotificationsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>通知</Text>
      <Text style={styles.sub}>未読 {notifications.filter(n => !n.read).length} 件</Text>

      <View style={{ gap: 10, marginTop: 16 }}>
        {notifications.map(n => (
          <View key={n.id} style={[styles.card, !n.read && styles.unread]}>
            <View style={[styles.icon, { backgroundColor: TYPE_COLOR[n.type] }]}>
              <Text style={styles.iconText}>{TYPE_ICON[n.type]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nTitle}>{n.title}</Text>
              <Text style={styles.nBody}>{n.body}</Text>
              <Text style={styles.nTime}>{new Date(n.createdAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {!n.read && <View style={styles.unreadDot} />}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: Radius.lg, padding: 14,
    borderWidth: 1, borderColor: Ink[100],
  },
  unread: { borderColor: Brand.navy, borderWidth: 1.5 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: '#fff', fontWeight: '800' },
  nTitle: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  nBody: { fontSize: 12, color: Ink[700], marginTop: 4 },
  nTime: { fontSize: 10, color: Ink[500], marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Accent.red, marginTop: 6 },
});
