import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { daysSince, jpy } from '@/lib/format';
import { customers, products } from '@/lib/mockData';

const STATUS_LABEL = { good: '好調', stall: '停滞', follow: '要フォロー' } as const;
const STATUS_COLOR = { good: Accent.emerald, stall: Accent.amber, follow: Accent.red } as const;

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = customers.find(x => x.id === id) ?? customers[0];
  const days = daysSince(c.lastOrderedAt) ?? 0;

  // 悲鳴 → 商品 の簡易マッチング（フィットスコア降順 top3）
  const suggestions = [...products].sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0)).slice(0, 3);

  return (
    <Screen>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: STATUS_COLOR[c.status] }]} />
        <Text style={[styles.statusText, { color: STATUS_COLOR[c.status] }]}>{STATUS_LABEL[c.status]}</Text>
      </View>
      <Text style={styles.name}>{c.name}</Text>
      <Text style={styles.branch}>{c.branch} / {c.businessType}</Text>
      <Text style={styles.address}>{c.address}</Text>

      {/* サマリー */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>今月売上</Text>
          <Text style={styles.summaryValue}>{jpy(c.monthSalesJpy)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>累計売上</Text>
          <Text style={styles.summaryValue}>{jpy(c.totalSalesJpy)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>自分のマージン</Text>
          <Text style={styles.summaryValue}>{jpy(c.monthMarginJpy)}</Text>
        </View>
      </View>

      {/* 悲鳴 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>この店舗の悲鳴</Text>
        <View style={styles.painRow}>
          {c.painPoints.map(p => (
            <View key={p} style={styles.painTag}><Text style={styles.painTagText}>{p}</Text></View>
          ))}
        </View>
      </View>

      {/* 発注サマリー */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>発注ステータス</Text>
        <View style={styles.statusBox}>
          <Text style={[styles.statusBigLabel, { color: STATUS_COLOR[c.status] }]}>
            最終発注 {days}日前
          </Text>
          <Text style={styles.statusNote}>
            {c.status === 'follow' ? '電話フォローを推奨します'
             : c.status === 'stall' ? '新商品提案で動きを作りましょう'
             : '継続順調。次の提案ネタ候補は以下'}
          </Text>
        </View>
      </View>

      {/* 推薦商品（特許要件3） */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>次の提案候補（適合度順）</Text>
        {suggestions.map(s => (
          <View key={s.id} style={styles.suggestion}>
            <View style={{ flex: 1 }}>
              <Text style={styles.suggestName}>{s.name}</Text>
              <Text style={styles.suggestPitch} numberOfLines={2}>{s.pitch}</Text>
            </View>
            <View style={styles.suggestScore}>
              <Text style={styles.suggestScoreText}>{Math.round((s.fitScore ?? 0) * 100)}%</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 商談メモ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最後の商談メモ</Text>
        <View style={styles.memoBox}>
          <Text style={styles.memoText}>
            前回訪問：オペ人員が限られているため、簡単に提供できる新メニューを探している。客単価の改善も課題。次回は「クラフト80 ピーチ」の試食を持参予定。
          </Text>
          <Text style={styles.memoDate}>2026-04-12</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: Ink[900] },
  branch: { fontSize: 12, color: Ink[700], marginTop: 2 },
  address: { fontSize: 11, color: Ink[500], marginTop: 2, marginBottom: 16 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: Ink[100] },
  summaryLabel: { fontSize: 10, color: Ink[500], letterSpacing: 0.5 },
  summaryValue: { fontSize: 15, fontWeight: '800', color: Ink[900], marginTop: 4 },

  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Ink[700], marginBottom: 10 },

  painRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  painTag: { backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  painTagText: { fontSize: 12, color: Accent.red, fontWeight: '600' },

  statusBox: { backgroundColor: '#fff', padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Ink[100] },
  statusBigLabel: { fontSize: 14, fontWeight: '700' },
  statusNote: { fontSize: 12, color: Ink[500], marginTop: 6 },

  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', padding: 14, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Ink[100], marginBottom: 8,
  },
  suggestName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  suggestPitch: { fontSize: 11, color: Ink[500], marginTop: 4, lineHeight: 15 },
  suggestScore: { backgroundColor: Brand.navy, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  suggestScoreText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  memoBox: { backgroundColor: '#fff', padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Ink[100] },
  memoText: { fontSize: 13, color: Ink[700], lineHeight: 20 },
  memoDate: { fontSize: 10, color: Ink[500], marginTop: 8 },
});
