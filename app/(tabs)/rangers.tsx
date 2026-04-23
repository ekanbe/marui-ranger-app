import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { rankLabel } from '@/constants/labels';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAdminOverview } from '@/hooks/use-admin-overview';
import { jpy } from '@/lib/format';

const RANK_COLOR: Record<string, string> = {
  platinum: '#8B7FB3',
  gold: Brand.gold,
  silver: '#9CA3AF',
  bronze: '#B8764A',
};

export default function RangersScreen() {
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

  const totalSales = overview.thisMonthSalesJpy;

  return (
    <Screen>
      <Text style={styles.title}>レンジャー管理</Text>
      <Text style={styles.sub}>
        稼働 {overview.totalRangers} 名・今月売上合計 {jpy(totalSales)}
      </Text>

      <View style={styles.listWrap}>
        {overview.rangers.map((r, i) => {
          const share = totalSales > 0 ? r.sales_jpy / totalSales : 0;
          return (
            <Pressable
              key={r.ranger_id}
              onPress={() => router.push({ pathname: '/ranger/[id]', params: { id: r.ranger_id } })}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.rank, i < 3 && { color: Brand.gold, fontWeight: '900' }]}>
                  #{i + 1}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.display_name}</Text>
                  <View style={[styles.rankPill, { backgroundColor: RANK_COLOR[r.current_rank] ?? Ink[300] }]}>
                    <Text style={styles.rankPillText}>{rankLabel(r.current_rank)}</Text>
                  </View>
                </View>
                <Text style={styles.sales}>{jpy(r.sales_jpy)}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
              <View style={styles.shareRow}>
                <Text style={styles.shareLabel}>全社売上寄与度</Text>
                <View style={styles.shareBar}>
                  <View style={[styles.shareBarFill, { width: `${Math.round(share * 100)}%` }]} />
                </View>
                <Text style={styles.sharePct}>{Math.round(share * 100)}%</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>
        ※ 将来：レンジャー個別の詳細（担当顧客一覧、契約情報、報酬率）・契約編集・休止/復帰の管理機能を追加予定
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, marginBottom: 18 },

  loadingBox: { paddingVertical: 48, alignItems: 'center' },

  listWrap: { gap: 10, marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 36, fontSize: 18, fontWeight: '800', color: Ink[700], textAlign: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: Ink[900] },
  rankPill: { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, marginTop: 4 },
  rankPillText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  sales: { fontSize: 15, fontWeight: '800', color: Ink[900] },

  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  shareLabel: { fontSize: 10, color: Ink[500], width: 90 },
  shareBar: {
    flex: 1,
    height: 6,
    backgroundColor: Ink[100],
    borderRadius: 999,
    overflow: 'hidden',
  },
  shareBarFill: {
    height: '100%',
    backgroundColor: Brand.navy,
    borderRadius: 999,
  },
  sharePct: { fontSize: 11, fontWeight: '700', color: Ink[700], width: 36, textAlign: 'right' },

  arrow: { fontSize: 20, color: Ink[300], marginLeft: 4 },

  note: { fontSize: 10, color: Ink[500], textAlign: 'center', lineHeight: 14 },
});
