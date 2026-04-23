import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { StatCard } from '@/components/ranger/StatCard';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAdminOverview } from '@/hooks/use-admin-overview';
import { jpy } from '@/lib/format';

const RANK_COLOR: Record<string, string> = {
  platinum: '#8B7FB3',
  gold: Brand.gold,
  silver: '#9CA3AF',
  bronze: '#B8764A',
};

export default function AdminScreen() {
  const { overview, loading } = useAdminOverview();

  if (loading || !overview) {
    return (
      <Screen>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>管理者ダッシュボード</Text>
      <Text style={styles.sub}>全レンジャー・全顧客のサマリー</Text>

      {/* ヒーロー */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>今月の全社売上</Text>
        <Text style={styles.heroValue}>{jpy(overview.thisMonthSalesJpy)}</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroSub}>受注 {overview.thisMonthOrderCount} 件</Text>
          <Text style={styles.heroSub}>レンジャー {overview.totalRangers} 名</Text>
          <Text style={styles.heroSub}>店舗 {overview.totalCustomers} 店</Text>
        </View>
      </View>

      {/* 報酬集計 */}
      <View style={styles.grid}>
        <StatCard
          label="未払報酬"
          value={jpy(overview.totalCommissionPending)}
          sub="confirm/pending 合計"
          subTone="amber"
          style={{ flex: 1 }}
        />
        <StatCard
          label="支払済報酬"
          value={jpy(overview.totalCommissionPaid)}
          sub="paid 合計"
          style={{ flex: 1 }}
        />
      </View>

      {/* ランガーランキング */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>レンジャー別 今月売上</Text>
        {overview.rangers.length === 0 ? (
          <Text style={styles.empty}>データなし</Text>
        ) : (
          overview.rangers.map((r, i) => (
            <View key={r.ranger_id} style={styles.row}>
              <Text style={[styles.rank, i < 3 && { color: Brand.gold, fontWeight: '900' }]}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rangerName}>{r.display_name}</Text>
                <View style={[styles.rankPill, { backgroundColor: RANK_COLOR[r.current_rank] ?? Ink[300] }]}>
                  <Text style={styles.rankPillText}>{r.current_rank.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.rangerSales}>{jpy(r.sales_jpy)}</Text>
            </View>
          ))
        )}
      </View>

      <Text style={styles.note}>※ この画面は admin ロール専用です</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, marginBottom: 20 },

  loadingBox: { paddingVertical: 48, alignItems: 'center' },

  hero: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.xl,
    padding: 22,
    marginBottom: 14,
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  heroValue: { color: '#fff', fontSize: 36, fontWeight: '800', marginTop: 6 },
  heroRow: { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },

  grid: { flexDirection: 'row', gap: 10, marginBottom: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Ink[100],
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Ink[900], marginBottom: 12 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  rank: { width: 24, fontSize: 16, fontWeight: '800', color: Ink[700], textAlign: 'center' },
  rangerName: { fontSize: 13, fontWeight: '600', color: Ink[900] },
  rankPill: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, marginTop: 4 },
  rankPillText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  rangerSales: { fontSize: 13, fontWeight: '700', color: Ink[900] },

  empty: { paddingVertical: 16, textAlign: 'center', color: Ink[500], fontSize: 12 },
  note: { fontSize: 10, color: Ink[500], textAlign: 'center', marginTop: 16 },
});

// Accent は将来拡張用
void Accent;
