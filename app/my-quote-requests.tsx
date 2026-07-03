import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useQuoteRequests, type QuoteRequestStatus } from '@/hooks/use-quote-requests';
import { jpy, shortDate } from '@/lib/format';

const STATUS_LABEL: Record<QuoteRequestStatus, string> = {
  pending: '承認待ち',
  approved: '承認済・Bカート登録待ち',
  rejected: '差戻し',
  registered: 'Bカート登録完了',
  cancelled: '取下げ',
};
const STATUS_TONE: Record<QuoteRequestStatus, 'amber' | 'emerald' | 'red' | 'navy' | 'neutral'> = {
  pending: 'amber',
  approved: 'navy',
  rejected: 'red',
  registered: 'emerald',
  cancelled: 'neutral',
};

export default function MyQuoteRequestsScreen() {
  const { session } = useAuth();
  const { rows, loading, error, reload } = useQuoteRequests({
    rangerId: session?.user.id ?? null,
    isAdmin: false,
  });
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  const openStatuses: QuoteRequestStatus[] = ['pending', 'approved', 'rejected'];
  const filtered = filter === 'open' ? rows.filter((r) => openStatuses.includes(r.status)) : rows;
  const openCount = rows.filter((r) => openStatuses.includes(r.status)).length;

  return (
    <Screen back>
      <Text style={styles.title}>見積依頼の状況</Text>
      <Text style={styles.sub}>
        あなたが起票した価格交渉案件です。承認後、Bカート に見積が登録されます。
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>読み込みに失敗しました: {error}</Text>
          <Pressable onPress={reload} style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.retryText}>🔄 再読み込み</Text>
          </Pressable>
        </View>
      ) : null}

      {/* フィルタ */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter('open')}
          style={({ pressed }) => [
            styles.chip,
            filter === 'open' && styles.chipActive,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.chipText, filter === 'open' && styles.chipTextActive]}>
            進行中 ({openCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('all')}
          style={({ pressed }) => [
            styles.chip,
            filter === 'all' && styles.chipActive,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>
            すべて ({rows.length})
          </Text>
        </Pressable>
        <Pressable onPress={reload} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}>
          <Text style={styles.chipText}>🔄 更新</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📝"
          title={filter === 'open' ? '進行中の見積依頼はありません' : '見積依頼はまだありません'}
          message="商品詳細の「見積依頼を起票」から価格交渉をはじめられます"
        />
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((r) => (
            <Card key={r.id} variant="surface" padding={14} style={{ gap: 8 }}>
              <View style={styles.headRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.customerName}>{r.customer_name}</Text>
                  <Text style={styles.meta}>{shortDate(r.created_at)}</Text>
                </View>
                <Badge label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
              </View>

              <View style={styles.productRow}>
                <Text style={styles.productName} numberOfLines={2}>
                  {r.product_name}
                </Text>
                <Text style={styles.quantity}>× {r.quantity}</Text>
              </View>

              <View style={styles.priceRow}>
                {r.standard_price_jpy != null ? (
                  <Text style={styles.standardPrice}>標準 {jpy(r.standard_price_jpy)}</Text>
                ) : null}
                <Text style={styles.requestedPrice}>希望 {jpy(r.requested_price_jpy)}</Text>
              </View>

              {r.reason ? <Text style={styles.reason}>「{r.reason}」</Text> : null}

              {/* 差戻し理由（admin_note） */}
              {r.status === 'rejected' && r.admin_note ? (
                <View style={styles.rejectNoteBox}>
                  <Text style={styles.rejectNoteLabel}>差戻し理由</Text>
                  <Text style={styles.rejectNoteText}>{r.admin_note}</Text>
                </View>
              ) : null}
              {r.status !== 'rejected' && r.admin_note ? (
                <View style={styles.adminNoteBox}>
                  <Text style={styles.adminNoteLabel}>管理者メモ</Text>
                  <Text style={styles.adminNoteText}>{r.admin_note}</Text>
                </View>
              ) : null}

              {/* 登録完了済の Bカート estimate 番号 */}
              {r.status === 'registered' && r.bcart_estimate_code ? (
                <Text style={styles.estimateCode}>Bカート 見積番号: {r.bcart_estimate_code}</Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, lineHeight: 18 },
  error: { color: Accent.red, fontSize: 12 },
  errorBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: Radius.sm,
    gap: 8,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: Ink[100],
  },
  retryText: { fontSize: 11, color: Ink[700], fontWeight: '700' },

  filterRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 10 },
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
  customerName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  meta: { fontSize: 11, color: Ink[500], marginTop: 2 },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Ink[100],
  },
  productName: { flex: 1, fontSize: 13, color: Ink[800], fontWeight: '600' },
  quantity: { fontSize: 13, color: Ink[700], fontWeight: '700' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  standardPrice: { fontSize: 11, color: Ink[500], textDecorationLine: 'line-through' },
  requestedPrice: { fontSize: 18, fontWeight: '800', color: Brand.gold },

  reason: {
    fontSize: 12,
    color: Ink[700],
    fontStyle: 'italic',
    paddingTop: 4,
  },

  rejectNoteBox: {
    backgroundColor: 'rgba(220,38,38,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.18)',
    padding: 10,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  rejectNoteLabel: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  rejectNoteText: { fontSize: 12, color: '#7F1D1D' },

  adminNoteBox: {
    backgroundColor: 'rgba(30,58,95,0.04)',
    padding: 10,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  adminNoteLabel: {
    fontSize: 10,
    color: Ink[500],
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  adminNoteText: { fontSize: 12, color: Ink[800] },

  estimateCode: {
    fontSize: 11,
    color: Ink[600],
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
