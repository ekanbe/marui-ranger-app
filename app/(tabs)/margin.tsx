import { Image } from 'expo-image';
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
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { type CommissionStatus, useCommissions } from '@/hooks/use-commissions';
import { useHomeKpis } from '@/hooks/use-home-kpis';
import { useProfile } from '@/hooks/use-profile';
import { jpy, shortDate } from '@/lib/format';
import { homeKpis } from '@/lib/mockData';

const STATUS_LABEL: Record<CommissionStatus, string> = { pending: '承認待ち', confirmed: '確定', paid: '受取済' };
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

  // ステータス別に集計
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = (c: typeof commissions[number]) => new Date(c.ordered_at) >= monthStart;

  const pendingTotal   = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.ranger_amount_jpy, 0);
  const confirmedTotal = commissions.filter((c) => c.status === 'confirmed').reduce((s, c) => s + c.ranger_amount_jpy, 0);
  const paidTotal      = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.ranger_amount_jpy, 0);
  const pendingCount   = commissions.filter((c) => c.status === 'pending').length;

  const confirmedThisMonth = commissions
    .filter((c) => c.status === 'confirmed' && thisMonth(c))
    .reduce((s, c) => s + c.ranger_amount_jpy, 0);

  // ── ソース別ブレイクダウン（今月分） ──
  const thisMonthCommissions = commissions.filter(thisMonth);
  const ecThisMonth = thisMonthCommissions.filter((c) => c.source === 'ec');
  const manualThisMonth = thisMonthCommissions.filter((c) => c.source === 'manual');
  const ecThisMonthJpy = ecThisMonth.reduce((s, c) => s + c.ranger_amount_jpy, 0);
  const manualThisMonthJpy = manualThisMonth.reduce((s, c) => s + c.ranger_amount_jpy, 0);
  const totalThisMonthJpy = ecThisMonthJpy + manualThisMonthJpy;
  const ecSharePct = totalThisMonthJpy > 0 ? ecThisMonthJpy / totalThisMonthJpy : 0;

  const monthlyTrend = kpis?.monthlyTrend ?? [];
  const maxTrend = Math.max(...monthlyTrend.map((m) => m.sales), 1);

  return (
    <Screen>
      <Text style={styles.title}>マージン</Text>

      <HeroCard
        label="今月の確定マージン"
        value={jpy(confirmedThisMonth)}
        tone="emerald"
        style={{ marginBottom: 14 }}
      >
        <Text style={styles.heroSub}>
          見込み {jpy(estimatedMarginJpy)}（今月売上の2%）
          {'\n'}
          {estimatedMarginDeltaJpy >= 0 ? '↑' : '↓'} {jpy(Math.abs(estimatedMarginDeltaJpy))}（前月比）
        </Text>
      </HeroCard>

      {/* ステータス別3カード */}
      <View style={styles.grid}>
        <KpiCard
          label="承認待ち"
          value={jpy(pendingTotal)}
          tone="amber"
          delta={`${pendingCount} 件`}
          style={{ flex: 1 }}
        />
        <KpiCard
          label="受取予定"
          value={jpy(confirmedTotal)}
          tone="emerald"
          delta="確定・入金待ち"
          style={{ flex: 1 }}
        />
      </View>
      <View style={styles.grid}>
        <KpiCard
          label="累計受取"
          value={jpy(paidTotal + cumulativeMarginJpy)}
          tone="ink"
          delta="2026年度"
          style={{ flex: 1 }}
        />
      </View>

      {/* ソース別ブレイクダウン（今月） */}
      {thisMonthCommissions.length > 0 ? (
        <>
          <SectionTitle title="今月の収入源" caption={`全 ${thisMonthCommissions.length} 件の報酬`} />
          <Card variant="surface" padding={16} style={{ marginBottom: 14 }}>
            <View style={styles.sourceRow}>
              <View style={styles.sourceLeft}>
                <View style={[styles.sourceDot, { backgroundColor: Brand.gold }]} />
                <Text style={styles.sourceLabel}>🔗 EC継続収入</Text>
              </View>
              <View style={styles.sourceRight}>
                <Text style={styles.sourceAmount}>{jpy(ecThisMonthJpy)}</Text>
                <Text style={styles.sourceCount}>{ecThisMonth.length}件</Text>
              </View>
            </View>
            <View style={styles.sourceBar}>
              <View style={[styles.sourceBarFill, { width: `${Math.round(ecSharePct * 100)}%` }]} />
            </View>
            <Text style={styles.sourceShare}>
              今月の {Math.round(ecSharePct * 100)}% が foodboat.jp の自動収入
            </Text>

            <View style={styles.sourceDivider} />

            <View style={styles.sourceRow}>
              <View style={styles.sourceLeft}>
                <View style={[styles.sourceDot, { backgroundColor: Ink[600] }]} />
                <Text style={styles.sourceLabel}>📝 手動入力</Text>
              </View>
              <View style={styles.sourceRight}>
                <Text style={styles.sourceAmount}>{jpy(manualThisMonthJpy)}</Text>
                <Text style={styles.sourceCount}>{manualThisMonth.length}件</Text>
              </View>
            </View>
          </Card>
        </>
      ) : null}

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
                <Text style={styles.chartValue}>{Math.round(m.sales / 10000)}万</Text>
                <Text style={styles.chartLabel}>{parseInt(m.month.slice(-2), 10)}月</Text>
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
              <View style={styles.orderThumbWrap}>
                {c.customer_image_url ? (
                  <Image source={{ uri: c.customer_image_url }} style={styles.orderThumb} contentFit="cover" />
                ) : (
                  <View style={[styles.orderThumb, styles.orderThumbPlaceholder]}><Text style={{ fontSize: 18 }}>🏪</Text></View>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.orderNameRow}>
                  <Text style={styles.orderName} numberOfLines={1}>{c.product_name}</Text>
                  {c.source === 'ec' ? (
                    <View style={styles.ecTag}>
                      <Text style={styles.ecTagText}>EC</Text>
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
  bar: { width: 20, backgroundColor: Brand.navy, borderRadius: 6, minHeight: 4 },
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
  orderThumbWrap: {
    width: 40, height: 40, borderRadius: 10, overflow: 'hidden',
    backgroundColor: Ink[100],
  },
  orderThumb: { width: 40, height: 40 },
  orderThumbPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(30,58,95,0.04)',
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
  orderCust: { fontSize: 11, color: Ink[500], marginTop: 2 },
  orderAmt: { fontSize: 14, fontWeight: '800', color: Ink[900] },

  // ソース別ブレイクダウン
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceRight: { alignItems: 'flex-end' },
  sourceDot: { width: 10, height: 10, borderRadius: 5 },
  sourceLabel: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  sourceAmount: { fontSize: 15, fontWeight: '800', color: Ink[900] },
  sourceCount: { fontSize: 10, color: Ink[500], marginTop: 1 },
  sourceBar: {
    height: 6, backgroundColor: Ink[100], borderRadius: 3,
    marginTop: 10, overflow: 'hidden',
  },
  sourceBarFill: {
    height: 6, backgroundColor: Brand.gold, borderRadius: 3,
  },
  sourceShare: { fontSize: 11, color: Ink[600], marginTop: 6, fontWeight: '600' },
  sourceDivider: { height: 1, backgroundColor: Ink[100], marginVertical: 12 },

  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  goalLabel: { fontSize: 12, color: Ink[500], fontWeight: '600' },
  goalPct: { fontSize: 22, fontWeight: '800', color: Accent.emerald },
  goalSub: { fontSize: 11, color: Ink[500], marginTop: 8 },

  adminTitle: { fontSize: 15, fontWeight: '800', color: Ink[900], marginBottom: 8 },
  adminBody: { fontSize: 13, color: Ink[700], lineHeight: 19 },
});
