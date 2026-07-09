import { router } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HeroCard } from '@/components/ui/HeroCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { Progress } from '@/components/ui/Progress';
import { CustomerThumb } from '@/components/ui/CustomerThumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { type CommissionStatus, useCommissions } from '@/hooks/use-commissions';
import { useHomeKpis } from '@/hooks/use-home-kpis';
import { useProfile } from '@/hooks/use-profile';
import { jpy, shortDate } from '@/lib/format';

const STATUS_LABEL: Record<CommissionStatus, string> = { pending: '承認待ち', confirmed: '確定', paid: '受取済' };
const STATUS_TONE: Record<CommissionStatus, 'amber' | 'emerald' | 'navy'> = {
  pending: 'amber',
  confirmed: 'emerald',
  paid: 'navy',
};

export default function MarginScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { kpis, loading: kpisLoading, error: kpisError, reload: reloadKpis } = useHomeKpis(session);
  const { rows: commissions, error: commissionsError, reload: reloadCommissions } = useCommissions(session);

  // 管理ガード: Web のみ。iOS/Android では admin もこの画面（個人マージン）を見られるようにする
  if (profile?.role === 'admin' && Platform.OS === 'web') {
    return (
      <Screen>
        <Text style={styles.title}>マージン</Text>
        <Card variant="elevated" padding={22} style={{ marginTop: 12 }}>
          <Text style={styles.adminTitle}>📊 管理者向けの画面ではありません</Text>
          <Text style={styles.adminBody}>
            この画面は個人レンジャーの報酬明細です。
            全社の報酬合計や払い出し状況は、管理者ダッシュボードでご確認いただけます。
          </Text>
          <View style={{ marginTop: 14 }}>
            <Button label="ダッシュボードへ戻る" variant="primary" size="lg" fullWidth onPress={() => router.push('/(tabs)')} />
          </View>
        </Card>
      </Screen>
    );
  }

  // KPI 読込中は Shimmer（モックへのフォールバックはしない）
  if (kpisLoading) {
    return (
      <Screen>
        <Text style={styles.title}>マージン</Text>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  // 読込エラー時は 0 円表示ではなくエラー表示＋再読み込み
  if (kpisError || commissionsError) {
    return (
      <Screen>
        <Text style={styles.title}>マージン</Text>
        <EmptyState
          icon="⚠️"
          title="読み込みに失敗しました"
          message={kpisError ?? commissionsError ?? undefined}
          actionLabel="再読み込み"
          onAction={() => {
            if (kpisError) reloadKpis();
            if (commissionsError) reloadCommissions();
          }}
        />
      </Screen>
    );
  }

  const estimatedMarginJpy = kpis?.estimatedMarginJpy ?? 0;
  const estimatedMarginDeltaJpy = kpis?.estimatedMarginDeltaJpy ?? 0;
  const cumulativeMarginJpy = kpis?.cumulativeMarginJpy ?? 0;
  const goalProgressPct = kpis?.goalProgressPct ?? 0;
  const remainingToGoalJpy = kpis?.remainingToGoalJpy ?? 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = (c: typeof commissions[number]) => new Date(c.ordered_at) >= monthStart;
  const currentMonthLabel = `${now.getMonth() + 1}月のマージン`;

  const paidTotal = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.ranger_amount_jpy, 0);

  const thisMonthCommissions = commissions.filter(thisMonth);

  const marginTrend = kpis?.marginTrend ?? [];
  const maxMarginTrend = Math.max(...marginTrend.map((m) => m.margin), 1);

  return (
    <Screen>
      <Text style={styles.title}>マージン</Text>

      <HeroCard
        label={currentMonthLabel}
        value={jpy(estimatedMarginJpy)}
        tone="emerald"
        style={{ marginBottom: 14 }}
      >
        <Text style={styles.heroSub}>
          {estimatedMarginDeltaJpy >= 0 ? '↑' : '↓'} {jpy(Math.abs(estimatedMarginDeltaJpy))}（前月比）
        </Text>
      </HeroCard>

      <View style={styles.grid}>
        {/* cumulativeMarginJpy は受取済(paid)を含む全期間マージンなので paidTotal を足すと二重計上になる */}
        <KpiCard
          label="累計マージン"
          value={jpy(cumulativeMarginJpy)}
          tone="ink"
          delta={`うち受取済 ${jpy(paidTotal)}`}
          style={{ flex: 1 }}
        />
      </View>

      {/* マージン推移 */}
      <SectionTitle title="マージン推移" caption="2026年4月開始〜" />
      <Card variant="surface" padding={20} style={{ marginBottom: 14 }}>
        {marginTrend.length === 0 ? (
          <Text style={styles.empty}>推移データがありません</Text>
        ) : (
          <View style={styles.chartRow}>
            {marginTrend.map((m) => (
              <View key={m.month} style={styles.chartCol}>
                <View style={styles.barWrap}>
                  <View style={[styles.bar, { height: Math.max(8, (m.margin / maxMarginTrend) * 120) }]} />
                </View>
                <Text style={styles.chartValue}>{jpy(m.margin)}</Text>
                <Text style={styles.chartLabel}>{parseInt(m.month.slice(-2), 10)}月</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* 受注・報酬内訳（今月分） */}
      <SectionTitle title={`${now.getMonth() + 1}月の受注・報酬内訳`} caption={`${thisMonthCommissions.length} 件`} />
      <Card variant="surface" padding={0} style={{ marginBottom: 14, overflow: 'hidden' }}>
        {thisMonthCommissions.length === 0 ? (
          <Text style={styles.empty}>報酬データがありません</Text>
        ) : (
          thisMonthCommissions.map((c, i) => (
            <View
              key={c.id}
              style={[styles.orderRow, i === thisMonthCommissions.length - 1 && { borderBottomWidth: 0 }]}
            >
              <CustomerThumb imageUrl={c.customer_image_url} size={40} radius={10} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.orderNameRow}>
                  <Text style={styles.orderName} numberOfLines={1}>{c.product_name}</Text>
                  {c.source === 'ec' ? (
                    <View style={styles.ecTag}>
                      <Text style={styles.ecTagText}>EC</Text>
                    </View>
                  ) : null}
                  {c.source === 'bcart' ? (
                    <View style={styles.bcartTag}>
                      <Text style={styles.bcartTagText}>BC</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.orderCust} numberOfLines={1}>{c.customer_name}・{shortDate(c.ordered_at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderAmt}>{jpy(c.ranger_amount_jpy)}</Text>
                <View style={{ marginTop: 4 }}>
                  <Badge label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} />
                </View>
              </View>
            </View>
          ))
        )}
      </Card>

      {/* 目標進捗 */}
      <SectionTitle title="今月の目標進捗" />
      <Card variant="surface" padding={20}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalLabel}>月間目標達成率</Text>
          <Text style={styles.goalPct}>{Math.round(goalProgressPct * 100)}%</Text>
        </View>
        <Progress progress={goalProgressPct} tone="gold" height={10} trackColor={Ink[100]} />
        <Text style={styles.goalSub}>あと {jpy(remainingToGoalJpy)} で月間目標達成</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], marginBottom: 16, letterSpacing: -0.3 },

  heroSub: { color: '#A7F3D0', marginTop: 10, fontSize: 13, fontWeight: '700' },

  grid: { flexDirection: 'row', gap: 10, marginBottom: 18 },

  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { alignItems: 'center', flex: 1 },
  barWrap: { height: 120, justifyContent: 'flex-end' },
  bar: { width: 20, backgroundColor: Accent.emerald, borderRadius: 6, minHeight: 4 },
  chartValue: { fontSize: 10, color: Ink[700], marginTop: 6, fontWeight: '700' },
  chartLabel: { fontSize: 9, color: Ink[500], marginTop: 2 },

  empty: { padding: 20, textAlign: 'center', color: Ink[500], fontSize: 12 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  orderName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  orderNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ecTag: {
    backgroundColor: 'rgba(201,168,118,0.18)',
    borderColor: Brand.gold,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  ecTagText: { color: Brand.gold, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  bcartTag: {
    backgroundColor: 'rgba(30,58,95,0.10)',
    borderColor: Brand.navy,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  bcartTagText: { color: Brand.navy, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  orderCust: { fontSize: 11, color: Ink[500], marginTop: 2 },
  orderAmt: { fontSize: 14, fontWeight: '800', color: Ink[900] },

  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  goalLabel: { fontSize: 12, color: Ink[500], fontWeight: '600' },
  goalPct: { fontSize: 22, fontWeight: '800', color: Accent.emerald },
  goalSub: { fontSize: 11, color: Ink[500], marginTop: 8 },

  adminTitle: { fontSize: 15, fontWeight: '800', color: Ink[900], marginBottom: 8 },
  adminBody: { fontSize: 13, color: Ink[700], lineHeight: 19 },
});
