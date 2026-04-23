import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { HeroCard } from '@/components/ui/HeroCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerList } from '@/components/ui/Shimmer';
import { rankLabel } from '@/constants/labels';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useRangerBadges } from '@/hooks/use-ranger-badges';
import { useRanking } from '@/hooks/use-ranking';
import { jpy } from '@/lib/format';

export default function RankingScreen() {
  const { session } = useAuth();
  const { rows, loading } = useRanking(session);
  const { badges } = useRangerBadges(session);
  const myRow = rows.find((r) => r.isMe);

  return (
    <Screen back>
      <Text style={styles.title}>ランク・実績</Text>

      {/* 自分のランク ヒーロー */}
      <HeroCard
        label="あなたの今月"
        value={jpy(myRow?.sales_jpy ?? 0)}
        tone="gold"
        style={{ marginBottom: 18 }}
      >
        <View style={styles.rankRow}>
          <View style={styles.rankOnHero}>
            <Text style={styles.rankOnHeroText}>{rankLabel(myRow?.current_rank)}</Text>
          </View>
          <Text style={styles.rankPos}>#{myRow?.rank ?? '-'}</Text>
        </View>
      </HeroCard>

      {/* バッジ */}
      <SectionTitle title="獲得バッジ" caption={`${badges.filter((b) => b.earned).length} / ${badges.length}`} />
      <View style={styles.badgeRow}>
        {badges.map((b) => (
          <View key={b.code} style={[styles.badge, !b.earned && styles.badgeLocked]}>
            <Text style={[styles.badgeIcon, !b.earned && { opacity: 0.3 }]}>🏅</Text>
            <Text style={[styles.badgeName, !b.earned && { color: Ink[400] }]} numberOfLines={2}>
              {b.name}
            </Text>
          </View>
        ))}
      </View>

      {/* ランキング */}
      <SectionTitle title="月間ランキング" caption={`全 ${rows.length} 名`} />
      {loading ? (
        <ShimmerList count={5} />
      ) : (
        <Card variant="surface" padding={0} style={{ overflow: 'hidden' }}>
          {rows.map((r, i) => {
            const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`;
            return (
              <View
                key={r.ranger_id}
                style={[
                  styles.rankItem,
                  r.isMe && styles.rankItemMe,
                  i === rows.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.rankMedal, r.rank <= 3 && { fontSize: 22 }]}>{medal}</Text>
                <Avatar name={r.display_name} imageUrl={r.avatar_url} size="sm" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.rankName, r.isMe && { fontWeight: '900', color: Brand.navy }]}>
                    {r.display_name}{r.isMe ? ' (あなた)' : ''}
                  </Text>
                  <View style={{ marginTop: 4 }}>
                    <Badge label={rankLabel(r.current_rank)} tone={r.current_rank as any} />
                  </View>
                </View>
                <Text style={styles.rankScore}>{jpy(r.sales_jpy)}</Text>
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], marginBottom: 16, letterSpacing: -0.3 },

  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  rankOnHero: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rankOnHeroText: { color: '#7C5C1E', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  rankPos: { color: '#fff', fontSize: 28, fontWeight: '900' },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  badge: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Ink[100],
    gap: 4,
    padding: 8,
  },
  badgeLocked: { backgroundColor: Ink[50] },
  badgeIcon: { fontSize: 28 },
  badgeName: { fontSize: 10, color: Ink[700], fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },

  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  rankItemMe: { backgroundColor: 'rgba(30,58,95,0.04)' },
  rankMedal: { width: 38, fontSize: 15, fontWeight: '800', color: Ink[700], textAlign: 'center' },
  rankName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  rankScore: { fontSize: 13, fontWeight: '800', color: Ink[900] },
});
