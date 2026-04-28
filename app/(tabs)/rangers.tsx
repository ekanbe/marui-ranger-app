import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { ShimmerList } from '@/components/ui/Shimmer';
import { rankLabel } from '@/constants/labels';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAdminOverview } from '@/hooks/use-admin-overview';
import { jpy } from '@/lib/format';

export default function RangersScreen() {
  const { overview, loading } = useAdminOverview();

  if (loading || !overview) {
    return (
      <Screen>
        <Text style={styles.title}>レンジャー管理</Text>
        <View style={{ marginTop: 12 }}>
          <ShimmerList count={5} />
        </View>
      </Screen>
    );
  }

  const totalSales = overview.thisMonthSalesJpy;

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>レンジャー管理</Text>
          <Text style={styles.sub}>
            稼働 {overview.totalRangers} 名・今月売上合計 {jpy(totalSales)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/ranger-new')}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.addBtnText}>+ レンジャーを追加</Text>
        </Pressable>
      </View>

      <View style={styles.listWrap}>
        {overview.rangers.map((r, i) => {
          const share = totalSales > 0 ? r.sales_jpy / totalSales : 0;
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

          return (
            <Pressable
              key={r.ranger_id}
              onPress={() => router.push({ pathname: '/ranger/[id]', params: { id: r.ranger_id } })}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.88 }]}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.rank, i < 3 && { fontSize: 24 }]}>{medal}</Text>
                <Avatar name={r.display_name} imageUrl={r.avatar_url} size="md" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.numberLabel}>レンジャー{r.ranger_number}号</Text>
                  <Text style={styles.name}>{r.display_name}</Text>
                  <View style={{ marginTop: 4, flexDirection: 'row', gap: 6 }}>
                    <Badge label={rankLabel(r.current_rank)} tone={r.current_rank as any} />
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sales}>{jpy(r.sales_jpy)}</Text>
                  <Text style={styles.salesLabel}>今月</Text>
                </View>
              </View>

              <View style={styles.shareRow}>
                <Text style={styles.shareLabel}>寄与度</Text>
                <View style={{ flex: 1 }}>
                  <Progress progress={share} tone="navy" height={6} trackColor={Ink[100]} />
                </View>
                <Text style={styles.sharePct}>{Math.round(share * 100)}%</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>
        ※ 将来：契約編集・休止/復帰管理・個別の報酬率設定機能を追加予定
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12, flexWrap: 'wrap' },
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },
  addBtn: { backgroundColor: Brand.navy, paddingHorizontal: 16, paddingVertical: 11, borderRadius: Radius.sm },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  listWrap: { gap: 10, marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rank: { fontSize: 16, fontWeight: '800', color: Ink[700], textAlign: 'center', width: 36 },
  numberLabel: { fontSize: 10, color: Ink[500], fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  name: { fontSize: 15, fontWeight: '800', color: Ink[900] },
  sales: { fontSize: 16, fontWeight: '800', color: Ink[900] },
  salesLabel: { fontSize: 10, color: Ink[500], marginTop: 2 },

  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  shareLabel: { fontSize: 10, color: Ink[500], width: 44, fontWeight: '700' },
  sharePct: { fontSize: 11, fontWeight: '800', color: Ink[700], width: 38, textAlign: 'right' },

  note: { fontSize: 10, color: Ink[400], textAlign: 'center', lineHeight: 14 },
});
