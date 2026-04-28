import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeroCard } from '@/components/ui/HeroCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { Progress } from '@/components/ui/Progress';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { rankLabel } from '@/constants/labels';
import { Ink } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { type DerivedStatus, deriveStatus } from '@/hooks/use-customers';
import { useProfile } from '@/hooks/use-profile';
import { useRangerDetail } from '@/hooks/use-ranger-detail';
import { daysSince, jpy, pct, shortDate } from '@/lib/format';

const STATUS_TONE: Record<DerivedStatus, 'emerald' | 'amber' | 'red'> = {
  good: 'emerald',
  stall: 'amber',
  follow: 'red',
};
const STATUS_LABEL: Record<DerivedStatus, string> = { good: '好調', stall: '停滞', follow: '要フォロー' };

export default function RangerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const isAdmin = profile?.role === 'admin';
  const { detail, loading } = useRangerDetail(id);

  if (loading) {
    return (
      <Screen back>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen back>
        <Text style={styles.notFound}>レンジャーが見つかりません</Text>
      </Screen>
    );
  }

  const remainingToGoal = Math.max(0, detail.monthly_goal_jpy - detail.thisMonthSalesJpy);

  return (
    <Screen back>
      {/* プロフィールヘッダー */}
      <View style={styles.header}>
        <Avatar name={detail.display_name} imageUrl={detail.avatar_url} size="xl" />
        <View style={{ flex: 1 }}>
          <Text style={styles.numberLabel}>レンジャー{detail.ranger_number}号</Text>
          <Text style={styles.name}>{detail.display_name}</Text>
          <View style={styles.badgeRow}>
            <Badge label={rankLabel(detail.current_rank)} tone={detail.current_rank as any} size="md" />
            <Text style={styles.code}>{detail.ranger_code}</Text>
          </View>
          {detail.joined_at ? <Text style={styles.subMeta}>加入 {shortDate(detail.joined_at)}</Text> : null}
          {detail.email ? <Text style={styles.subMeta} numberOfLines={1}>{detail.email}</Text> : null}
        </View>
        {isAdmin ? (
          <View style={{ alignSelf: 'flex-start' }}>
            <Button
              label="編集"
              variant="secondary"
              size="sm"
              onPress={() => router.push({ pathname: '/ranger-edit/[id]', params: { id: detail.id } })}
            />
          </View>
        ) : null}
      </View>

      {/* 今月実績ヒーロー */}
      <HeroCard label="今月の売上" value={jpy(detail.thisMonthSalesJpy)} tone="navy" style={{ marginBottom: 14 }}>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroSub}>目標 {jpy(detail.monthly_goal_jpy)}</Text>
          <Text style={styles.heroAccent}>{pct(detail.goalProgressPct)}</Text>
        </View>
        <View style={{ marginTop: 10 }}>
          <Progress progress={detail.goalProgressPct} tone="gold" height={8} />
        </View>
        <Text style={styles.heroRemaining}>
          目標まであと <Text style={styles.heroStrong}>{jpy(remainingToGoal)}</Text>
        </Text>
      </HeroCard>

      {/* KPI 2x2 */}
      <View style={styles.grid}>
        <KpiCard label="今月受注" value={`${detail.thisMonthOrderCount}`} unit="件" tone="ink" style={styles.gridItem} />
        <KpiCard label="累計売上" value={jpy(detail.totalSalesJpy)} tone="ink" delta="全期間" style={styles.gridItem} />
        <KpiCard label="累計受注" value={`${detail.totalOrderCount}`} unit="件" tone="ink" style={styles.gridItem} />
        <KpiCard label="未払報酬" value={jpy(detail.totalCommissionPending)} tone="amber" delta="未確定・確定合計" style={styles.gridItem} />
      </View>

      {/* 担当顧客 */}
      <SectionTitle title="担当顧客" caption={`${detail.customers.length} 店`} />
      {detail.customers.length === 0 ? (
        <EmptyState icon="🏪" title="担当顧客がいません" />
      ) : (
        <Card variant="surface" padding={0} style={{ overflow: 'hidden' }}>
          {detail.customers.map((c, i) => {
            const ds = deriveStatus(c.last_ordered_at);
            const days = daysSince(c.last_ordered_at);
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: c.id } })}
                style={({ pressed }) => [
                  styles.customerRow,
                  i === detail.customers.length - 1 && { borderBottomWidth: 0 },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.custThumbWrap}>
                  {c.image_url ? (
                    <Image source={{ uri: c.image_url }} style={styles.custThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.custThumb, styles.custThumbPlaceholder]}><Text style={{ fontSize: 18 }}>🏪</Text></View>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {c.name}{c.branch_name ? ` ${c.branch_name}` : ''}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' }}>
                    <Badge label={STATUS_LABEL[ds]} tone={STATUS_TONE[ds]} dot />
                    <Text style={styles.customerMeta}>
                      最終発注 {days !== null ? `${days}日前` : '未発注'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            );
          })}
        </Card>
      )}

      <Text style={styles.note}>※ 報酬率変更・ランクアップ承認・契約編集は将来対応予定</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { paddingVertical: 48, textAlign: 'center', color: Ink[500] },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 20, marginTop: 4 },
  numberLabel: { fontSize: 10, color: Ink[500], fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  name: { fontSize: 20, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  code: { fontSize: 11, color: Ink[500], fontWeight: '700', letterSpacing: 0.5 },
  subMeta: { fontSize: 11, color: Ink[500], marginTop: 4 },

  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  heroAccent: { color: '#6EE7B7', fontSize: 15, fontWeight: '800' },
  heroRemaining: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 8 },
  heroStrong: { color: '#fff', fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  gridItem: { width: '48%', flexGrow: 1 },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  custThumbWrap: {
    width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
    backgroundColor: Ink[100],
  },
  custThumb: { width: 44, height: 44 },
  custThumbPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(30,58,95,0.04)',
  },
  customerName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  customerMeta: { fontSize: 11, color: Ink[500] },
  arrow: { fontSize: 22, color: Ink[300], fontWeight: '300' },

  note: { fontSize: 10, color: Ink[400], textAlign: 'center', marginTop: 14, lineHeight: 14 },
});
