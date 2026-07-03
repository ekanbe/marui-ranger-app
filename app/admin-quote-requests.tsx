import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import {
  approveQuoteRequest,
  markQuoteRequestRegistered,
  rejectQuoteRequest,
  useQuoteRequests,
  type QuoteRequest,
  type QuoteRequestStatus,
} from '@/hooks/use-quote-requests';
import { jpy, shortDate } from '@/lib/format';

function notify(msg: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(msg);
  } else {
    Alert.alert('完了', msg);
  }
}

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

export default function AdminQuoteRequestsScreen() {
  const { session } = useAuth();
  const { profile, loading: profileLoading } = useProfile(session);
  const isAdmin = profile?.role === 'admin';

  const { rows, loading, error, reload } = useQuoteRequests({ rangerId: null, isAdmin: true });
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [actioning, setActioning] = useState<string | null>(null);
  const [registerTarget, setRegisterTarget] = useState<QuoteRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<QuoteRequest | null>(null);

  if (profileLoading || !isAdmin) {
    return <AdminGuard loading={profileLoading} />;
  }

  const filtered = filter === 'pending' ? rows.filter((r) => r.status === 'pending') : rows;
  const pendingCount = rows.filter((r) => r.status === 'pending').length;

  return (
    <Screen back>
      <Text style={styles.title}>見積依頼管理</Text>
      <Text style={styles.sub}>
        レンジャーが起票した価格交渉案件。承認後、Bカート 管理画面で見積登録してください。
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* フィルタ */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter('pending')}
          style={({ pressed }) => [
            styles.chip,
            filter === 'pending' && styles.chipActive,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.chipText, filter === 'pending' && styles.chipTextActive]}>
            承認待ち ({pendingCount})
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
          title={filter === 'pending' ? '承認待ちはありません' : '見積依頼はまだありません'}
          message={
            filter === 'pending'
              ? 'レンジャーが新規起票するとここに表示されます'
              : 'レンジャーがアプリから起票するとここに表示されます'
          }
        />
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((r) => (
            <Card key={r.id} variant="surface" padding={14} style={{ gap: 8 }}>
              <View style={styles.headRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.customerName}>{r.customer_name}</Text>
                  <Text style={styles.meta}>
                    {r.ranger_name ? `担当: ${r.ranger_name} ／ ` : ''}
                    {shortDate(r.created_at)}
                  </Text>
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
                  <Text style={styles.standardPrice}>
                    標準 {jpy(r.standard_price_jpy)}
                  </Text>
                ) : null}
                <Text style={styles.requestedPrice}>希望 {jpy(r.requested_price_jpy)}</Text>
                {r.standard_price_jpy != null && r.standard_price_jpy > 0 ? (
                  <Text style={styles.discount}>
                    {Math.round((1 - r.requested_price_jpy / r.standard_price_jpy) * 100)}% OFF
                  </Text>
                ) : null}
              </View>

              {r.reason ? <Text style={styles.reason}>「{r.reason}」</Text> : null}

              {r.admin_note ? (
                <View style={styles.adminNoteBox}>
                  <Text style={styles.adminNoteLabel}>管理者メモ</Text>
                  <Text style={styles.adminNoteText}>{r.admin_note}</Text>
                </View>
              ) : null}

              {/* 承認待ち時のアクション */}
              {r.status === 'pending' ? (
                <View style={styles.actionRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="✓ 承認"
                      variant="primary"
                      size="md"
                      fullWidth
                      disabled={actioning === r.id}
                      onPress={async () => {
                        setActioning(r.id);
                        const res = await approveQuoteRequest(r.id);
                        setActioning(null);
                        if (res.ok) {
                          notify('✅ 承認しました。Bカート 管理画面で見積登録してください。');
                          reload();
                        } else notify('エラー: ' + res.error);
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="差戻し"
                      variant="secondary"
                      size="md"
                      fullWidth
                      disabled={actioning === r.id}
                      onPress={() => setRejectTarget(r)}
                    />
                  </View>
                </View>
              ) : null}

              {/* 承認済時: Bカート 登録完了の記録 */}
              {r.status === 'approved' ? (
                <View>
                  <Button
                    label="🏢 Bカートで見積登録完了をマーク"
                    variant="secondary"
                    size="md"
                    fullWidth
                    onPress={() => setRegisterTarget(r)}
                  />
                </View>
              ) : null}

              {/* 登録完了済の Bカート estimate 番号 */}
              {r.status === 'registered' && r.bcart_estimate_code ? (
                <Text style={styles.estimateCode}>
                  Bカート 見積番号: {r.bcart_estimate_code}
                </Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}

      {/* Bカート 登録完了モーダル */}
      {registerTarget ? (
        <RegisterModal
          target={registerTarget}
          onClose={() => setRegisterTarget(null)}
          onConfirm={async (id, code) => {
            const res = await markQuoteRequestRegistered(registerTarget.id, id, code);
            if (res.ok) {
              setRegisterTarget(null);
              notify('✅ Bカート 登録完了をマークしました');
              reload();
            } else notify('エラー: ' + res.error);
          }}
        />
      ) : null}

      {/* 差戻し理由モーダル（window.prompt はネイティブに存在しないため使わない） */}
      {rejectTarget ? (
        <RejectModal
          target={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={async (note) => {
            const res = await rejectQuoteRequest(rejectTarget.id, note);
            if (res.ok) {
              setRejectTarget(null);
              notify('差戻しました');
              reload();
            } else notify('エラー: ' + res.error);
          }}
        />
      ) : null}
    </Screen>
  );
}

function RegisterModal({
  target,
  onClose,
  onConfirm,
}: {
  target: QuoteRequest;
  onClose: () => void;
  onConfirm: (id: string, code: string) => Promise<void>;
}) {
  const [bcartId, setBcartId] = useState('');
  const [bcartCode, setBcartCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Bカート 登録完了</Text>
          <Text style={styles.modalSub}>
            {target.customer_name} × {target.product_name}
          </Text>
          <Text style={styles.modalLabel}>Bカート 見積ID (URLの数字)</Text>
          <TextInput
            value={bcartId}
            onChangeText={setBcartId}
            placeholder="例: 62"
            placeholderTextColor={Ink[400]}
            style={styles.input}
            keyboardType="numeric"
          />
          <Text style={styles.modalLabel}>Bカート 見積番号 (任意)</Text>
          <TextInput
            value={bcartCode}
            onChangeText={setBcartCode}
            placeholder="例: 17769058486"
            placeholderTextColor={Ink[400]}
            style={styles.input}
          />
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <Button label="キャンセル" variant="secondary" size="md" fullWidth disabled={submitting} onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="登録完了"
                variant="primary"
                size="md"
                fullWidth
                loading={submitting}
                disabled={!bcartId || submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await onConfirm(bcartId.trim(), bcartCode.trim());
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RejectModal({
  target,
  onClose,
  onConfirm,
}: {
  target: QuoteRequest;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>差戻し</Text>
          <Text style={styles.modalSub}>
            {target.customer_name} × {target.product_name}
          </Text>
          <Text style={styles.modalLabel}>差戻し理由 (レンジャーに見えます)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="例: 希望単価が仕入原価を下回っています"
            placeholderTextColor={Ink[400]}
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
          />
          <View style={styles.modalActions}>
            <View style={{ flex: 1 }}>
              <Button label="キャンセル" variant="secondary" size="md" fullWidth disabled={submitting} onPress={onClose} />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="差戻す"
                variant="primary"
                size="md"
                fullWidth
                loading={submitting}
                disabled={!note.trim() || submitting}
                onPress={async () => {
                  setSubmitting(true);
                  try {
                    await onConfirm(note.trim());
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, lineHeight: 18 },
  error: { color: Accent.red, fontSize: 12, marginTop: 10 },

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
  discount: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
    backgroundColor: 'rgba(220,38,38,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  reason: {
    fontSize: 12,
    color: Ink[700],
    fontStyle: 'italic',
    paddingTop: 4,
  },

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

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 6 },

  estimateCode: {
    fontSize: 11,
    color: Ink[600],
    marginTop: 4,
    fontFamily: 'monospace',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,35,64,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 20,
    width: '100%',
    maxWidth: 440,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Ink[900] },
  modalSub: { fontSize: 12, color: Ink[600], marginTop: 2, marginBottom: 12 },
  modalLabel: { fontSize: 11, color: Ink[700], fontWeight: '700', marginTop: 10, marginBottom: 6 },
  input: {
    padding: 10,
    backgroundColor: Ink[50],
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    fontSize: 14,
    color: Ink[900],
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
});
