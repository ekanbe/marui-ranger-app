import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ranger/ProgressBar';
import { Screen } from '@/components/ranger/Screen';
import { StatCard } from '@/components/ranger/StatCard';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCommissions, type CommissionStatus } from '@/hooks/use-commissions';
import { useHomeKpis } from '@/hooks/use-home-kpis';
import { useProfile } from '@/hooks/use-profile';
import { jpy, shortDate } from '@/lib/format';
import { homeKpis } from '@/lib/mockData';

const STATUS_LABEL: Record<CommissionStatus, string> = { pending: '未確定', confirmed: '確定', paid: '支払済' };
const STATUS_COLOR: Record<CommissionStatus, string> = {
  pending: Accent.amber,
  confirmed: Accent.emerald,
  paid: Brand.navy,
};

export default function MarginScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { kpis } = useHomeKpis(session);
  const { rows: commissions } = useCommissions(session);

  // 管理者は個人のマージン情報が無いので案内画面を出す
  if (profile?.role === 'admin') {
    return (
      <Screen>
        <Text style={styles.title}>マージン</Text>
        <View style={styles.adminCard}>
          <Text style={styles.adminTitle}>📊 管理者向けの画面ではありません</Text>
          <Text style={styles.adminBody}>
            この画面は個人レンジャーの報酬明細です。
            全社の報酬合計や払い出し状況は、管理者ダッシュボードでご確認いただけます。
          </Text>
          <Pressable onPress={() => router.push('/(tabs)')} style={styles.adminButton}>
            <Text style={styles.adminButtonText}>ダッシュボードへ戻る</Text>
          </Pressable>
        </View>
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

      {/* ヒーローカード */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>今月見込み報酬</Text>
        <Text style={styles.heroValue}>{jpy(estimatedMarginJpy)}</Text>
        <Text style={styles.heroSub}>▲ {jpy(estimatedMarginDeltaJpy)}（前月比）</Text>
      </View>

      <View style={styles.grid}>
        <StatCard label="未払予定" value={jpy(pendingTotal)} sub="次回支払：月末" subTone="amber" style={{ flex: 1 }} />
        <StatCard label="累計支払済" value={jpy(paidTotal + cumulativeMarginJpy)} sub="2026年度" style={{ flex: 1 }} />
      </View>

      {/* 売上推移（モック：データ十分揃ったら差し替え） */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>月別売上推移</Text>
        <View style={styles.chartRow}>
          {monthlyTrend.map((m) => (
            <View key={m.month} style={styles.chartCol}>
              <View style={styles.barWrap}>
                <View style={[styles.bar, { height: (m.sales / maxTrend) * 120 }]} />
              </View>
              <Text style={styles.chartValue}>{Math.round(m.sales / 1000)}k</Text>
              <Text style={styles.chartLabel}>{m.month.slice(-2)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 受注・報酬内訳 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>受注・報酬内訳</Text>
        {commissions.length === 0 ? (
          <Text style={styles.empty}>報酬データがありません</Text>
        ) : (
          commissions.map((c) => (
            <View key={c.id} style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderName}>{c.product_name}</Text>
                <Text style={styles.orderCust}>
                  {c.customer_name}・{shortDate(c.ordered_at)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderAmt}>{jpy(c.ranger_amount_jpy)}</Text>
                <Text style={[styles.orderStatus, { color: STATUS_COLOR[c.status] }]}>{STATUS_LABEL[c.status]}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 目標進捗 */}
      <View style={styles.card}>
        <View style={styles.goalHeader}>
          <Text style={styles.cardTitle}>今月の目標進捗</Text>
          <Text style={styles.goalPct}>{Math.round(goalProgressPct * 100)}%</Text>
        </View>
        <ProgressBar progress={goalProgressPct} height={10} trackColor={Ink[100]} />
        <Text style={styles.goalSub}>あと {jpy(remainingToGoalJpy)} で月間目標達成</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], marginBottom: 16 },

  hero: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 12,
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  heroValue: { color: '#fff', fontSize: 40, fontWeight: '800', marginTop: 6 },
  heroSub: { color: Accent.emeraldLight, marginTop: 8, fontSize: 13, fontWeight: '600' },

  grid: { flexDirection: 'row', gap: 10, marginBottom: 12 },

  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 18, borderWidth: 1, borderColor: Ink[100], marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Ink[900], marginBottom: 14 },

  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { alignItems: 'center', flex: 1 },
  barWrap: { height: 120, justifyContent: 'flex-end' },
  bar: { width: 20, backgroundColor: Brand.navy, borderRadius: 4 },
  chartValue: { fontSize: 10, color: Ink[700], marginTop: 6, fontWeight: '600' },
  chartLabel: { fontSize: 9, color: Ink[500], marginTop: 2 },

  empty: { paddingVertical: 12, textAlign: 'center', color: Ink[500], fontSize: 12 },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Ink[100] },
  orderName: { fontSize: 13, fontWeight: '600', color: Ink[900] },
  orderCust: { fontSize: 11, color: Ink[500], marginTop: 2 },
  orderAmt: { fontSize: 14, fontWeight: '700', color: Ink[900] },
  orderStatus: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalPct: { fontSize: 18, fontWeight: '800', color: Brand.navy },
  goalSub: { fontSize: 11, color: Ink[500], marginTop: 8 },

  adminCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 22,
    borderWidth: 1,
    borderColor: Ink[100],
    marginTop: 12,
    gap: 10,
  },
  adminTitle: { fontSize: 14, fontWeight: '700', color: Ink[900] },
  adminBody: { fontSize: 12, color: Ink[700], lineHeight: 18 },
  adminButton: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  adminButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
