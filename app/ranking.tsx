import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useHomeKpis } from '@/hooks/use-home-kpis';
import { useMyRanger } from '@/hooks/use-my-ranger';
import { useProfile } from '@/hooks/use-profile';
import { jpy } from '@/lib/format';
import { badges, rangerProfile, rankings } from '@/lib/mockData';

const RANK_COLOR: Record<string, string> = {
  platinum: '#8B7FB3',
  gold: Brand.gold,
  silver: '#9CA3AF',
  bronze: '#B8764A',
};

export default function RankingScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { ranger } = useMyRanger(session);
  const { kpis } = useHomeKpis(session);

  const myName = profile?.display_name ?? rangerProfile.name;
  const myRankLabel = ranger?.current_rank ?? rangerProfile.rank;
  const myScore = kpis?.monthSalesJpy ?? 0;

  // 自分のエントリを実データに差し替え、スコア降順で順位再計算
  const merged = rankings.map((r) =>
    r.me
      ? { ...r, name: `${myName} (あなた)`, score: myScore, rankLabel: myRankLabel }
      : r
  );
  const ranked = [...merged].sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
  const myRank = ranked.find((r) => r.me);

  return (
    <Screen>
      <Text style={styles.title}>ランク・実績</Text>

      {/* 自分のランク */}
      <View style={styles.myCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.myLabel}>あなたの今月</Text>
          <View style={styles.rankRow}>
            <View style={[styles.rankPill, { backgroundColor: RANK_COLOR[myRankLabel] ?? Ink[500] }]}>
              <Text style={styles.rankPillText}>{myRankLabel.toUpperCase()}</Text>
            </View>
            <Text style={styles.rankPos}>#{myRank?.rank ?? '-'}</Text>
          </View>
          <Text style={styles.myScore}>{jpy(myScore)}</Text>
        </View>
      </View>

      {/* バッジ（まだモックのまま：ranger_badgesテーブルに後で差し替え） */}
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
      <View style={styles.rankList}>
        {ranked.map((r) => (
          <View key={r.name + r.rank} style={[styles.rankItem, r.me && styles.rankItemMe]}>
            <Text style={[styles.rankNo, r.rank <= 3 && { color: Brand.gold, fontWeight: '900' }]}>{r.rank}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rankName, r.me && { fontWeight: '800', color: Brand.navy }]}>{r.name}</Text>
              <Text style={styles.rankBadge}>{r.rankLabel.toUpperCase()}</Text>
            </View>
            <Text style={styles.rankScore}>{jpy(r.score)}</Text>
          </View>
        ))}
      </View>
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
