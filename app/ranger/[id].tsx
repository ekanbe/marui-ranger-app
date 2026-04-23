import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ranger/ProgressBar';
import { Screen } from '@/components/ranger/Screen';
import { StatCard } from '@/components/ranger/StatCard';
import { rankLabel } from '@/constants/labels';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { deriveStatus } from '@/hooks/use-customers';
import { useRangerDetail } from '@/hooks/use-ranger-detail';
import { daysSince, jpy, pct, shortDate } from '@/lib/format';

const RANK_COLOR: Record<string, string> = {
  platinum: '#8B7FB3',
  gold: Brand.gold,
  silver: '#9CA3AF',
  bronze: '#B8764A',
};

const STATUS_COLOR: Record<string, string> = {
  good: Accent.emerald,
  stall: Accent.amber,
  follow: Accent.red,
};
const STATUS_LABEL: Record<string, string> = { good: '好調', stall: '停滞', follow: '要フォロー' };

export default function RangerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading } = useRangerDetail(id);

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen>
        <Text style={styles.notFound}>レンジャーが見つかりません</Text>
      </Screen>
    );
  }

  const remainingToGoal = Math.max(0, detail.monthly_goal_jpy - detail.thisMonthSalesJpy);

  return (
    <Screen>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{detail.display_name.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{detail.display_name}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.rankPill, { backgroundColor: RANK_COLOR[detail.current_rank] ?? Ink[300] }]}>
              <Text style={styles.rankPillText}>{rankLabel(detail.current_rank)}</Text>
            </View>
            <Text style={styles.meta}>{detail.ranger_code}</Text>
          </View>
          {detail.joined_at && (
            <Text style={styles.subMeta}>加入 {shortDate(detail.joined_at)}</Text>
          )}
          {detail.email && <Text style={styles.subMeta}>{detail.email}</Text>}
        </View>
      </View>

      {/* 今月実績 */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>今月の売上</Text>
        <Text style={styles.heroValue}>{jpy(detail.thisMonthSalesJpy)}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroSub}>目標 {jpy(detail.monthly_goal_jpy)}</Text>
          <Text style={styles.heroAccent}>{pct(detail.goalProgressPct)}</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          <ProgressBar progress={detail.goalProgressPct} height={8} />
        </View>
        <Text style={styles.heroRemaining}>
          目標まであと <Text style={styles.heroStrong}>{jpy(remainingToGoal)}</Text>
        </Text>
      </View>

      <View style={styles.grid}>
        <StatCard label="今月受注" value={`${detail.thisMonthOrderCount}件`} style={styles.gridItem} />
        <StatCard label="累計売上" value={jpy(detail.totalSalesJpy)} sub="全期間" style={styles.gridItem} />
        <StatCard label="累計受注" value={`${detail.totalOrderCount}件`} style={styles.gridItem} />
        <StatCard
          label="未払報酬"
          value={jpy(detail.totalCommissionPending)}
          sub="未確定・確定合計"
          subTone="amber"
          style={styles.gridItem}
        />
      </View>

      {/* 担当顧客 */}
      <Text style={styles.sectionTitle}>担当顧客（{detail.customers.length}店）</Text>
      <View style={styles.card}>
        {detail.customers.length === 0 ? (
          <Text style={styles.empty}>担当顧客がいません</Text>
        ) : (
          detail.customers.map((c) => {
            const ds = deriveStatus(c.last_ordered_at);
            const days = daysSince(c.last_ordered_at);
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: c.id } })}
                style={styles.customerRow}
              >
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[ds] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>
                    {c.name}
                    {c.branch_name ? ` ${c.branch_name}` : ''}
                  </Text>
                  <Text style={styles.customerMeta}>
                    {STATUS_LABEL[ds]}・最終発注 {days !== null ? `${days}日前` : '未発注'}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={styles.note}>※ 報酬率の変更・ランクアップ承認・契約編集は将来対応予定</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  notFound: { paddingVertical: 48, textAlign: 'center', color: Ink[500] },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  name: { fontSize: 18, fontWeight: '800', color: Ink[900] },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rankPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  rankPillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  meta: { fontSize: 11, color: Ink[700], fontWeight: '600' },
  subMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },

  hero: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.xl,
    padding: 22,
    marginBottom: 14,
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 6 },
  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  heroAccent: { color: Accent.emeraldLight, fontSize: 14, fontWeight: '700' },
  heroRemaining: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 6 },
  heroStrong: { color: '#fff', fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  gridItem: { width: '48%', flexGrow: 1 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: Ink[700], marginBottom: 10, marginTop: 6 },

  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Ink[100],
    marginBottom: 14,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  customerName: { fontSize: 13, fontWeight: '600', color: Ink[900] },
  customerMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  arrow: { fontSize: 20, color: Ink[300] },

  empty: { paddingVertical: 24, textAlign: 'center', color: Ink[500], fontSize: 12 },
  note: { fontSize: 10, color: Ink[500], textAlign: 'center', marginTop: 4, lineHeight: 14 },
});
