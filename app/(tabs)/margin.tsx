import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { HeroCard } from '@/components/ui/HeroCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { Progress } from '@/components/ui/Progress';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Accent, Appetite, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { type CommissionStatus, useCommissions } from '@/hooks/use-commissions';
import { useHomeKpis } from '@/hooks/use-home-kpis';
import { useProfile } from '@/hooks/use-profile';
import { jpy, shortDate } from '@/lib/format';
import { homeKpis } from '@/lib/mockData';

const STATUS_LABEL: Record<CommissionStatus, string> = { pending: '未確定', confirmed: '確定', paid: '支払済' };
const STATUS_TONE: Record<CommissionStatus, 'amber' | 'emerald' | 'navy'> = {
  pending: 'amber',
  confirmed: 'emerald',
  paid: 'navy',
};

export default function MarginScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { kpis } = useHomeKpis(session);
  const { rows: commissions } = useCommissions(session);

  if (profile?.role === 'admin') {
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

  const estimatedMarginJpy = kpis?.estimatedMarginJpy ?? homeKpis.estimatedMarginJpy;
  const estimatedMarginDeltaJpy = kpis?.estimatedMarginDeltaJpy ?? homeKpis.estimatedMarginDeltaJpy;
  const cumulativeMarginJpy = kpis?.cumulativeMarginJpy ?? homeKpis.cumulativeMarginJpy;
  const goalProgressPct = kpis?.goalProgressPct ?? homeKpis.goalProgressPct;
  const remainingToGoalJpy = kpis?.remainingToGoalJpy ?? homeKpis.remainingToGoalJpy;

  const pendingTotal = commissions.filter((c) => c.status !== 'paid').reduce((s, c) => s + c.ranger_amount_jpy, 0);
  const paidTotal = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.ranger_amount_jpy, 0);

  const monthlyTrend = kpis?.monthlyTrend ?? [];
  const maxTrend = Math.max(...monthlyTrend.map((m) => m.sales), 1);

  return (
    <Screen>
      <Text style={styles.title}>マージン</Text>

      <HeroCard
        label="今月見込み報酬"
        value={jpy(estimatedMarginJpy)}
        tone="emerald"
        style={{ marginBottom: 14 }}
      >
        <Text style={styles.heroSub}>▲ {jpy(estimatedMarginDeltaJpy)}（前月比）</Text>
      </HeroCard>

      <View style={styles.grid}>
        <KpiCard label="未払予定" value={jpy(pendingTotal)} tone="amber" delta="次回支払：月末" style={{ flex: 1 }} />
        <KpiCard label="累計支払済" value={jpy(paidTotal + cumulativeMarginJpy)} tone="navy" delta="2026年度" style={{ flex: 1 }} />
      </View>

      {/* 月別売上推移 */}
      <SectionTitle title="月別売上推移" caption="過去6ヶ月" />
      <Card variant="surface" padding={20} style={{ marginBottom: 14 }}>
        {monthlyTrend.length === 0 ? (
          <Text style={styles.empty}>推移データがありません</Text>
        ) : (
          <View style={styles.chartRow}>
            {monthlyTrend.map((m) => (
              <View key={m.month} style={styles.chartCol}>
                <View style={styles.barWrap}>
                  <View style={[styles.bar, { height: Math.max(8, (m.sales / maxTrend) * 120) }]} />
                </View>
                <Text style={styles.chartValue}>{Math.round(m.sales / 1000)}k</Text>
                <Text style={styles.chartLabel}>{m.month.slice(-2)}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* 受注・報酬内訳 */}
      <SectionTitle title="受注・報酬内訳" caption={`${commissions.length} 件`} />
      <Card variant="surface" padding={0} style={{ marginBottom: 14, overflow: 'hidden' }}>
        {commissions.length === 0 ? (
          <Text style={styles.empty}>報酬データがありません</Text>
        ) : (
          commissions.map((c, i) => (
            <View
              key={c.id}
              style={[styles.orderRow, i === commissions.length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.orderName} numberOfLines={1}>{c.product_name}</Text>
                <Text style={styles.orderCust}>{c.customer_name}・{shortDate(c.ordered_at)}</Text>
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
  bar: { width: 20, backgroundColor: Brand.navy, borderRadius: 6, minHeight: 4 },
  chartValue: { fontSize: 10, color: Ink[700], marginTop: 6, fontWeight: '700' },
  chartLabel: { fontSize: 9, color: Ink[500], marginTop: 2 },

  empty: { padding: 20, textAlign: 'center', color: Ink[500], fontSize: 12 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  orderName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  orderCust: { fontSize: 11, color: Ink[500], marginTop: 2 },
  orderAmt: { fontSize: 14, fontWeight: '800', color: Ink[900] },

  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  goalLabel: { fontSize: 12, color: Ink[500], fontWeight: '600' },
  goalPct: { fontSize: 22, fontWeight: '800', color: Appetite.ember },
  goalSub: { fontSize: 11, color: Ink[500], marginTop: 8 },

  adminTitle: { fontSize: 15, fontWeight: '800', color: Ink[900], marginBottom: 8 },
  adminBody: { fontSize: 13, color: Ink[700], lineHeight: 19 },
});
