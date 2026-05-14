import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBcartEstimates, type BcartEstimate } from '@/hooks/use-bcart-estimates';
import { useProfile } from '@/hooks/use-profile';
import { jpy, shortDate } from '@/lib/format';

type Filter = 'all' | 'pending' | 'registered' | 'cancelled';

const FILTER_LABEL: Record<Filter, string> = {
  all: 'すべて',
  pending: '新規見積',
  registered: '受注済',
  cancelled: 'キャンセル',
};

function matchesFilter(r: BcartEstimate, f: Filter): boolean {
  if (f === 'all') return true;
  if (f === 'registered') return !!r.related_order_id;
  if (f === 'cancelled') return r.bcart_status === 'キャンセル';
  // pending
  return !r.related_order_id && r.bcart_status !== 'キャンセル';
}

export default function AdminBcartEstimatesScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const isAdmin = profile?.role === 'admin';

  const { rows, summary, loading, error, reload } = useBcartEstimates();
  const [filter, setFilter] = useState<Filter>('pending');

  if (!isAdmin) {
    return (
      <Screen back>
        <Text style={styles.error}>管理者のみ利用可能です</Text>
      </Screen>
    );
  }

  const filtered = rows.filter((r) => matchesFilter(r, filter));

  return (
    <Screen back>
      <Text style={styles.title}>Bカート 見積一覧</Text>
      <Text style={styles.sub}>
        Bカート で登録された見積を Polling で同期しています (毎日 03:10 JST)。
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* サマリ */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: 'rgba(245,158,11,0.08)' }]}>
          <Text style={styles.summaryLabel}>新規見積</Text>
          <Text style={[styles.summaryValue, { color: '#B45309' }]}>{summary.pending}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: 'rgba(5,150,105,0.08)' }]}>
          <Text style={styles.summaryLabel}>受注済</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>{summary.registered}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: Ink[100] }]}>
          <Text style={styles.summaryLabel}>キャンセル</Text>
          <Text style={[styles.summaryValue, { color: Ink[600] }]}>{summary.cancelled}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: 'rgba(30,58,95,0.06)' }]}>
          <Text style={styles.summaryLabel}>合計</Text>
          <Text style={[styles.summaryValue, { color: Brand.navy }]}>{summary.total}</Text>
        </View>
      </View>

      {/* フィルタ */}
      <View style={styles.filterRow}>
        {(['pending', 'all', 'registered', 'cancelled'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={({ pressed }) => [
              styles.chip,
              filter === f && styles.chipActive,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {FILTER_LABEL[f]}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={reload} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
          <Text style={styles.chipText}>🔄</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="該当する見積はありません"
          message={
            filter === 'pending'
              ? '新規見積はすべて受注変換またはキャンセルされました'
              : 'フィルタを変えてみてください'
          }
        />
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.slice(0, 100).map((r) => (
            <Card key={r.id} variant="surface" padding={14} style={{ gap: 6 }}>
              <View style={styles.headRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.compName} numberOfLines={1}>
                    {r.bcart_comp_name ?? r.customer_name ?? '(顧客不明)'}
                  </Text>
                  <Text style={styles.meta}>
                    {r.estimated_at ? shortDate(r.estimated_at) : '-'}
                    {r.bcart_estimate_code ? ` ／ ${r.bcart_estimate_code}` : ''}
                  </Text>
                </View>
                {r.related_order_id ? (
                  <Badge label="✓ 受注済" tone="emerald" />
                ) : r.bcart_status === 'キャンセル' ? (
                  <Badge label="キャンセル" tone="neutral" />
                ) : (
                  <Badge label={r.bcart_status ?? '新規'} tone="amber" />
                )}
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>見積総額</Text>
                <Text style={styles.priceValue}>
                  {jpy(r.final_price ?? r.total_price ?? 0)}
                </Text>
              </View>

              {r.customer_message ? (
                <Text style={styles.message}>📩 顧客より「{r.customer_message}」</Text>
              ) : null}

              {r.memo ? (
                <Text style={styles.memo}>📝 管理メモ: {r.memo}</Text>
              ) : null}

              {r.related_order_id ? (
                <Text style={styles.linkedOrder}>
                  → 受注ID: {r.related_order_id}
                </Text>
              ) : null}

              {r.estimate_due ? (
                <Text style={styles.due}>期限: {r.estimate_due}</Text>
              ) : null}
            </Card>
          ))}
          {filtered.length > 100 ? (
            <Text style={styles.moreHint}>上位100件まで表示中（全{filtered.length}件）</Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },
  error: { color: Accent.red, fontSize: 12, marginTop: 10 },

  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 10 },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 10, color: Ink[600], fontWeight: '700' },
  summaryValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: Ink[100],
  },
  chipActive: { backgroundColor: Brand.navy },
  chipText: { fontSize: 11, color: Ink[700], fontWeight: '700' },
  chipTextActive: { color: '#fff' },

  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  compName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  meta: { fontSize: 11, color: Ink[500], marginTop: 2 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  priceLabel: { fontSize: 11, color: Ink[500] },
  priceValue: { fontSize: 16, fontWeight: '800', color: Brand.gold, marginLeft: 'auto' },

  message: { fontSize: 12, color: Ink[700], fontStyle: 'italic' },
  memo: { fontSize: 11, color: Ink[600] },
  linkedOrder: { fontSize: 11, color: '#059669', fontWeight: '700' },
  due: { fontSize: 10, color: Ink[500] },

  moreHint: { fontSize: 11, color: Ink[400], textAlign: 'center', marginTop: 8 },
});
