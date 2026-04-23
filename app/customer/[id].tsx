import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { deriveStatus, type DerivedStatus } from '@/hooks/use-customers';
import { useCustomerDetail } from '@/hooks/use-customer-detail';
import { daysSince, jpy } from '@/lib/format';

const STATUS_LABEL: Record<DerivedStatus, string> = { good: '好調', stall: '停滞', follow: '要フォロー' };
const STATUS_COLOR: Record<DerivedStatus, string> = { good: Accent.emerald, stall: Accent.amber, follow: Accent.red };

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading } = useCustomerDetail(id);

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen>
        <Text style={styles.notFound}>顧客が見つかりません</Text>
      </Screen>
    );
  }

  const status = deriveStatus(detail.last_ordered_at);
  const days = daysSince(detail.last_ordered_at) ?? 0;
  const suggestions = detail.recommendations;

  return (
    <Screen>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
        <Text style={[styles.statusText, { color: STATUS_COLOR[status] }]}>{STATUS_LABEL[status]}</Text>
      </View>
      <Text style={styles.name}>{detail.name}</Text>
      <Text style={styles.branch}>
        {detail.branch_name ? `${detail.branch_name} / ` : ''}
        {detail.business_type ?? '-'}
      </Text>
      <Text style={styles.address}>{detail.address ?? '-'}</Text>

      {/* サマリー */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>今月売上</Text>
          <Text style={styles.summaryValue}>{jpy(detail.monthSalesJpy)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>累計売上</Text>
          <Text style={styles.summaryValue}>{jpy(detail.totalSalesJpy)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>自分のマージン</Text>
          <Text style={styles.summaryValue}>{jpy(detail.monthMarginJpy)}</Text>
        </View>
      </View>

      {/* 悲鳴 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>この店舗の悲鳴</Text>
        <View style={styles.painRow}>
          {detail.painPoints.length > 0 ? (
            detail.painPoints.map((p) => (
              <View key={p} style={styles.painTag}>
                <Text style={styles.painTagText}>{p}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyInline}>登録されていません</Text>
          )}
        </View>
      </View>

      {/* 発注サマリー */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>発注ステータス</Text>
        <View style={styles.statusBox}>
          <Text style={[styles.statusBigLabel, { color: STATUS_COLOR[status] }]}>最終発注 {days}日前</Text>
          <Text style={styles.statusNote}>
            {status === 'follow'
              ? '電話フォローを推奨します'
              : status === 'stall'
              ? '新商品提案で動きを作りましょう'
              : '継続順調。次の提案ネタ候補は以下'}
          </Text>
        </View>
      </View>

      {/* 推薦商品（特許要件③：fn_generate_recommendations が生成） */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>次の提案候補（適合度順）</Text>
        {suggestions.length === 0 ? (
          <Text style={styles.emptyInline}>推薦商品がまだ生成されていません</Text>
        ) : (
          suggestions.map((s) => (
            <View key={s.id} style={styles.suggestion}>
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestName}>{s.product_name}</Text>
                {s.pitch_script && (
                  <Text style={styles.suggestPitch} numberOfLines={2}>
                    {s.pitch_script}
                  </Text>
                )}
              </View>
              <View style={styles.suggestScore}>
                <Text style={styles.suggestScoreText}>{Math.round(s.score * 100)}%</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 48, alignItems: 'center' },
  notFound: { paddingVertical: 48, textAlign: 'center', color: Ink[500] },

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
  emptyInline: { fontSize: 12, color: Ink[500] },

  statusBox: { backgroundColor: '#fff', padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Ink[100] },
  statusBigLabel: { fontSize: 14, fontWeight: '700' },
  statusNote: { fontSize: 12, color: Ink[500], marginTop: 6 },

  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Ink[100],
    marginBottom: 8,
  },
  suggestName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  suggestPitch: { fontSize: 11, color: Ink[500], marginTop: 4, lineHeight: 15 },
  suggestScore: { backgroundColor: Brand.navy, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  suggestScoreText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});
