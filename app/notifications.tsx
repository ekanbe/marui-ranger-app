import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerList } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { type NotificationType, useNotifications } from '@/hooks/use-notifications';

const TYPE_COLOR: Record<NotificationType, string> = {
  order: Brand.navy,
  achievement: Accent.emerald,
  alert: Accent.red,
  recommend: Brand.navy,
  progress: Accent.amber,
};

const TYPE_ICON: Record<NotificationType, string> = {
  order: '📦',
  achievement: '🏆',
  alert: '⚠️',
  recommend: '💡',
  progress: '📈',
};

const TYPE_LABEL: Record<NotificationType, string> = {
  order: '受注',
  achievement: '達成',
  alert: 'アラート',
  recommend: '提案',
  progress: '進捗',
};

function fmt(ts: string) {
  const date = new Date(ts);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}時間前`;
  return date.toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

type Filter = 'all' | 'unread';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const { rows, loading } = useNotifications(session);
  const [filter, setFilter] = useState<Filter>('all');

  const unreadCount = rows.filter((n) => !n.read_at).length;
  const list = filter === 'unread' ? rows.filter((n) => !n.read_at) : rows;

  return (
    <Screen back>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>通知</Text>
          <Text style={styles.sub}>
            {unreadCount > 0 ? `未読 ${unreadCount} 件` : '未読はありません'}
          </Text>
        </View>
      </View>

      <ChipRow style={{ marginBottom: 16 }}>
        <Chip label="すべて" count={rows.length} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="未読のみ" count={unreadCount} active={filter === 'unread'} onPress={() => setFilter('unread')} />
      </ChipRow>

      {loading ? (
        <ShimmerList count={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="📭"
          title={filter === 'unread' ? '未読の通知はありません' : '通知はありません'}
          message="新しい受注や達成イベントがあれば、ここに届きます"
        />
      ) : (
        <View style={{ gap: 10 }}>
          {list.map((n) => {
            const unread = !n.read_at;
            return (
              <View key={n.id} style={[styles.card, unread && styles.unread]}>
                <View style={[styles.icon, { backgroundColor: `${TYPE_COLOR[n.type]}18` }]}>
                  <Text style={styles.iconText}>{TYPE_ICON[n.type]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.topRow}>
                    <Text style={[styles.typeTag, { color: TYPE_COLOR[n.type] }]}>
                      {TYPE_LABEL[n.type]}
                    </Text>
                    <Text style={styles.nTime}>{fmt(n.created_at)}</Text>
                  </View>
                  <Text style={styles.nTitle}>{n.title}</Text>
                  {n.body ? <Text style={styles.nBody}>{n.body}</Text> : null}
                </View>
                {unread ? <View style={styles.unreadDot} /> : null}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 14 },
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },

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
  unread: {
    borderColor: 'rgba(30,58,95,0.25)',
    borderWidth: 1.5,
    backgroundColor: 'rgba(30,58,95,0.02)',
  },
  icon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 18 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  typeTag: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  nTime: { fontSize: 10, color: Ink[400] },
  nTitle: { fontSize: 13, fontWeight: '800', color: Ink[900] },
  nBody: { fontSize: 12, color: Ink[700], marginTop: 4, lineHeight: 17 },

  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Accent.red, marginTop: 4 },
});
