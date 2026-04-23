import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { rankLabel } from '@/constants/labels';
import { useAuth } from '@/hooks/use-auth';
import { useRangerBadges } from '@/hooks/use-ranger-badges';
import { useRanking } from '@/hooks/use-ranking';
import { jpy } from '@/lib/format';

const RANK_COLOR: Record<string, string> = {
  platinum: '#8B7FB3',
  gold: Brand.gold,
  silver: '#9CA3AF',
  bronze: '#B8764A',
};

export default function RankingScreen() {
  const { session } = useAuth();
  const { rows, loading } = useRanking(session);
  const { badges } = useRangerBadges(session);
  const myRow = rows.find((r) => r.isMe);

  return (
    <Screen>
      <Text style={styles.title}>ランク・実績</Text>

      {/* 自分のランク */}
      <View style={styles.myCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.myLabel}>あなたの今月</Text>
          <View style={styles.rankRow}>
            <View style={[styles.rankPill, { backgroundColor: RANK_COLOR[myRow?.current_rank ?? 'bronze'] ?? Ink[500] }]}>
              <Text style={styles.rankPillText}>{rankLabel(myRow?.current_rank)}</Text>
            </View>
            <Text style={styles.rankPos}>#{myRow?.rank ?? '-'}</Text>
          </View>
          <Text style={styles.myScore}>{jpy(myRow?.sales_jpy ?? 0)}</Text>
        </View>
      </View>

      {/* バッジ（まだモック：ranger_badgesテーブルへ差し替え予定） */}
      <Text style={styles.sectionTitle}>獲得バッジ</Text>
      <View style={styles.badgeRow}>
        {badges.map((b) => (
          <View key={b.code} style={[styles.badge, !b.earned && styles.badgeLocked]}>
            <Text style={[styles.badgeIcon, !b.earned && { opacity: 0.3 }]}>★</Text>
            <Text style={[styles.badgeName, !b.earned && { color: Ink[500] }]}>{b.name}</Text>
          </View>
        ))}
      </View>

      {/* ランキング */}
      <Text style={styles.sectionTitle}>月間ランキング</Text>
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      ) : (
        <View style={styles.rankList}>
          {rows.map((r) => (
            <View key={r.ranger_id} style={[styles.rankItem, r.isMe && styles.rankItemMe]}>
              <Text style={[styles.rankNo, r.rank <= 3 && { color: Brand.gold, fontWeight: '900' }]}>{r.rank}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rankName, r.isMe && { fontWeight: '800', color: Brand.navy }]}>
                  {r.display_name}
                  {r.isMe ? ' (あなた)' : ''}
                </Text>
                <Text style={styles.rankBadge}>{rankLabel(r.current_rank)}</Text>
              </View>
              <Text style={styles.rankScore}>{jpy(r.sales_jpy)}</Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], marginBottom: 16 },

  myCard: {
    flexDirection: 'row',
    backgroundColor: Brand.navy,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 20,
  },
  myLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  rankPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  rankPillText: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  rankPos: { color: '#fff', fontSize: 28, fontWeight: '900' },
  myScore: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 10 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: Ink[700], marginBottom: 10 },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  badge: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Ink[100],
    gap: 6,
  },
  badgeLocked: { backgroundColor: Ink[50] },
  badgeIcon: { fontSize: 28, color: Brand.gold },
  badgeName: { fontSize: 10, color: Ink[700], fontWeight: '600', textAlign: 'center' },

  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  rankList: { gap: 6 },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  rankItemMe: { borderColor: Brand.navy, borderWidth: 2, backgroundColor: 'rgba(30,58,95,0.04)' },
  rankNo: { width: 28, fontSize: 18, fontWeight: '800', color: Ink[700], textAlign: 'center' },
  rankName: { fontSize: 13, color: Ink[900] },
  rankBadge: { fontSize: 10, color: Ink[500], marginTop: 2, letterSpacing: 1 },
  rankScore: { fontSize: 13, fontWeight: '700', color: Ink[900] },
});
