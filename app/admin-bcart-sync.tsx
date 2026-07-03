import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
import {
  resolveUnmatchedBcartOrder,
  unlinkBcartCustomer,
  useBcartSync,
  type BcartUnmatchedOrder,
} from '@/hooks/use-bcart-sync';
import { useCustomers } from '@/hooks/use-customers';
import { useProfile } from '@/hooks/use-profile';
import { jpy, shortDate } from '@/lib/format';

function notify(msg: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(msg);
  } else {
    Alert.alert('完了', msg);
  }
}

function confirmDialog(msg: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(msg)) onConfirm();
    return;
  }
  Alert.alert('確認', msg, [
    { text: 'キャンセル', style: 'cancel' },
    { text: 'OK', onPress: onConfirm },
  ]);
}

function relativeTime(iso: string | null) {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const d = Math.floor(hr / 24);
  return `${d}日前`;
}

export default function AdminBcartSyncScreen() {
  const { session } = useAuth();
  const { profile, loading: profileLoading } = useProfile(session);
  const isAdmin = profile?.role === 'admin';

  const { data, loading, error, reload } = useBcartSync();

  const [pickerOrder, setPickerOrder] = useState<BcartUnmatchedOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLinked, setShowLinked] = useState(true);

  if (profileLoading || !isAdmin) {
    return <AdminGuard loading={profileLoading} />;
  }

  return (
    <Screen back>
      <Text style={styles.title}>Bカート同期管理</Text>
      <Text style={styles.sub}>Bカート（直接取引EC）との連携状況</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading || !data ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      ) : (
        <>
          {/* ── セクション1: ヘルスチェック ──────────────── */}
          <SectionTitle title="同期ヘルスチェック" style={{ marginTop: 20 }} />

          <Card variant="surface" padding={14} style={{ marginBottom: 14 }}>
            <View style={styles.healthRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.healthLabel}>最終受注同期</Text>
                <Text style={styles.healthValue}>
                  {data.lastOrdersSync
                    ? relativeTime(data.lastOrdersSync.sync_started_at)
                    : '未実行'}
                </Text>
              </View>
              <View style={styles.healthStatusWrap}>
                {data.lastOrdersSync ? (
                  <Badge
                    label={
                      data.lastOrdersSync.status === 'success'
                        ? '✓ 成功'
                        : data.lastOrdersSync.status === 'failed'
                          ? '✕ 失敗'
                          : '実行中'
                    }
                    tone={
                      data.lastOrdersSync.status === 'success'
                        ? 'emerald'
                        : data.lastOrdersSync.status === 'failed'
                          ? 'red'
                          : 'amber'
                    }
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.weeklyCaption}>直近7日の取込み実績</Text>
            <View style={styles.weeklyRow}>
              <WeeklyStat label="取得" value={data.weekly.fetched} tone="ink" />
              <WeeklyStat label="マッチ" value={data.weekly.matched} tone="emerald" />
              <WeeklyStat label="未マッチ" value={data.weekly.unmatched} tone="amber" />
            </View>

            <Text style={styles.syncHint}>
              同期はサーバー側の自動ジョブで実行されます（pg_cron）。手動で即時実行したい場合は
              <Text style={{ fontWeight: '700' }}> npm run sync:bcart </Text>
              をターミナルで実行してください。
            </Text>

            <View style={{ marginTop: 10 }}>
              <Button
                label="🔄 状態を再読み込み"
                variant="secondary"
                size="sm"
                onPress={reload}
              />
            </View>
          </Card>

          {/* ── セクション2: 未マッチ受注 ─────────────── */}
          <SectionTitle
            title="未マッチの受注"
            caption={`${data.unmatched.length}件（顧客の bcart_customer_id 未補填）`}
            style={{ marginTop: 8 }}
          />

          {data.unmatched.length === 0 ? (
            <EmptyState
              icon="📭"
              title="未マッチの受注はありません"
              message="同期で顧客に紐付かなかった受注がここに表示されます"
            />
          ) : (
            <View style={{ gap: 10 }}>
              {data.unmatched.slice(0, 50).map((o) => (
                <Card key={o.id} variant="surface" padding={14} style={{ gap: 10 }}>
                  <View style={styles.groupHead}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.compNameText} numberOfLines={1}>
                        {o.bcart_comp_name ?? '(社名なし)'}
                      </Text>
                      <Text style={styles.groupMeta}>
                        {shortDate(o.ordered_at)} ／ 注文番号:{' '}
                        {o.bcart_order_code ?? o.bcart_order_id}
                      </Text>
                      <Text style={styles.bcartIdText}>
                        bcart_customer_id: {o.bcart_customer_id ?? '(なし)'}
                      </Text>
                    </View>
                    <Text style={styles.groupYen}>
                      {jpy(o.final_price ?? o.total_price)}
                    </Text>
                  </View>

                  {o.bcart_status ? (
                    <View style={{ alignSelf: 'flex-start' }}>
                      <Badge label={o.bcart_status} tone="neutral" />
                    </View>
                  ) : null}

                  <Button
                    label="顧客に紐付ける"
                    variant="primary"
                    size="md"
                    fullWidth
                    onPress={() => setPickerOrder(o)}
                  />
                </Card>
              ))}
              {data.unmatched.length > 50 ? (
                <Text style={styles.moreHint}>
                  上位50件まで表示中（全{data.unmatched.length}件）
                </Text>
              ) : null}
            </View>
          )}

          {/* ── セクション3: 紐付け済み顧客（折りたたみ） ─── */}
          <Pressable onPress={() => setShowLinked((v) => !v)} style={styles.toggleRow}>
            <SectionTitle
              title={`Bカート紐付け済み顧客（${data.linkedCustomers.length}）`}
              style={{ flex: 1, marginTop: 20 }}
            />
            <Text style={styles.toggleArrow}>{showLinked ? '▲' : '▼'}</Text>
          </Pressable>

          {showLinked ? (
            data.linkedCustomers.length === 0 ? (
              <EmptyState
                icon="🔗"
                title="紐付け済みの顧客はいません"
                message="未マッチキューから顧客を紐付けると、ここに表示されます"
              />
            ) : (
              <View style={{ gap: 10 }}>
                {data.linkedCustomers.map((c) => (
                  <Card key={c.customer_id} variant="surface" padding={14}>
                    <View style={styles.linkedHead}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.linkedName}>{c.customer_name}</Text>
                        {c.branch_name ? (
                          <Text style={styles.linkedSub}>{c.branch_name}</Text>
                        ) : null}
                        <Text style={styles.linkedSub}>
                          {c.ranger_name ? `担当: ${c.ranger_name} ／ ` : ''}
                          紐付け: {shortDate(c.bcart_linked_at)}
                        </Text>
                      </View>
                      <Text style={styles.linkedYen}>{jpy(c.bcart_total_yen)}</Text>
                    </View>

                    <View style={styles.linkedStats}>
                      <Text style={styles.linkedStat}>
                        Bカート受注{' '}
                        <Text style={styles.statStrong}>{c.bcart_order_count}</Text>件
                      </Text>
                      <Text style={styles.memberChip}>
                        ID: {c.bcart_customer_id}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => {
                        confirmDialog(
                          `${c.customer_name} のBカート紐付けを解除します。よろしいですか？\n\n※既に生成された受注・報酬は残ります`,
                          async () => {
                            setBusy(true);
                            const r = await unlinkBcartCustomer(c.customer_id);
                            setBusy(false);
                            if (r.ok) {
                              notify('✅ 紐付けを解除しました');
                              reload();
                            } else {
                              notify('エラー: ' + r.error);
                            }
                          },
                        );
                      }}
                      style={styles.unlinkBtn}
                    >
                      <Text style={styles.unlinkText}>紐付け解除</Text>
                    </Pressable>
                  </Card>
                ))}
              </View>
            )
          ) : null}

          {/* ── セクション4: 同期ログ（折りたたみ） ───────── */}
          <Pressable onPress={() => setShowLogs((v) => !v)} style={styles.toggleRow}>
            <SectionTitle
              title="同期ログ（デバッグ用）"
              style={{ flex: 1, marginTop: 20 }}
            />
            <Text style={styles.toggleArrow}>{showLogs ? '▲' : '▼'}</Text>
          </Pressable>

          {showLogs ? (
            <View style={{ gap: 8 }}>
              {data.recentLogs.length === 0 ? (
                <Text style={styles.emptyHint}>ログなし</Text>
              ) : (
                data.recentLogs.map((l) => (
                  <Card key={l.id} variant="surface" padding={12}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Badge label={l.sync_kind} tone="violet" />
                      <Badge
                        label={l.status}
                        tone={
                          l.status === 'success'
                            ? 'emerald'
                            : l.status === 'failed'
                              ? 'red'
                              : 'amber'
                        }
                      />
                      <Text style={styles.logDate}>{shortDate(l.sync_started_at)}</Text>
                    </View>
                    <Text style={styles.logStats}>
                      取得 {l.records_fetched} / マッチ {l.records_matched} / 未マッチ{' '}
                      {l.records_unmatched} / upsert {l.records_upserted}
                    </Text>
                    {l.error_message ? (
                      <Text style={styles.logError}>{l.error_message}</Text>
                    ) : null}
                  </Card>
                ))
              )}
            </View>
          ) : null}
        </>
      )}

      {/* 顧客ピッカー モーダル */}
      {pickerOrder ? (
        <CustomerPickerModal
          order={pickerOrder}
          busy={busy}
          onClose={() => setPickerOrder(null)}
          onConfirm={async (customerId) => {
            setBusy(true);
            const r = await resolveUnmatchedBcartOrder(pickerOrder.id, customerId);
            setBusy(false);
            if (!r.ok) {
              notify('エラー: ' + r.error);
              return;
            }
            setPickerOrder(null);
            notify(
              '✅ 紐付けました\n\n以降この顧客の Bカート受注は自動でマッチします',
            );
            reload();
          }}
        />
      ) : null}
    </Screen>
  );
}

// ====================================================================
// 顧客ピッカー モーダル
// ====================================================================
function CustomerPickerModal({
  order,
  busy,
  onClose,
  onConfirm,
}: {
  order: BcartUnmatchedOrder;
  busy: boolean;
  onClose: () => void;
  onConfirm: (customerId: string) => void;
}) {
  const { customers, loading } = useCustomers();
  const [query, setQuery] = useState(order.bcart_comp_name ?? '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 50);
    return customers
      .filter((c) => {
        const hay = `${c.name} ${c.branch_name ?? ''} ${c.address ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 50);
  }, [customers, query]);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>顧客に紐付け</Text>
          <Text style={styles.modalSub}>
            Bカート社名:{' '}
            <Text style={{ fontWeight: '700' }}>{order.bcart_comp_name ?? '—'}</Text>
          </Text>
          <Text style={styles.modalSub}>
            {shortDate(order.ordered_at)} ／ {jpy(order.final_price ?? order.total_price)}
          </Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="顧客名・支店で検索"
            placeholderTextColor={Ink[400]}
            style={styles.searchInput}
          />

          <View style={styles.modalList}>
            {loading ? (
              <Text style={styles.emptyHint}>読み込み中...</Text>
            ) : filtered.length === 0 ? (
              <Text style={styles.emptyHint}>該当なし</Text>
            ) : (
              filtered.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    confirmDialog(
                      `${c.name} にこのBカート受注を紐付けます。\n` +
                        `顧客レコードに bcart_customer_id=${order.bcart_customer_id ?? '?'} を保存し、以降は自動マッチされます。`,
                      () => onConfirm(c.id),
                    );
                  }}
                  style={({ pressed }) => [
                    styles.modalRow,
                    pressed && { backgroundColor: Ink[100] },
                  ]}
                  disabled={busy}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.modalRowName}>{c.name}</Text>
                    {c.branch_name ? (
                      <Text style={styles.modalRowSub} numberOfLines={1}>
                        {c.branch_name}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.modalRowArrow}>›</Text>
                </Pressable>
              ))
            )}
          </View>

          <View style={{ marginTop: 12 }}>
            <Button
              label="キャンセル"
              variant="secondary"
              size="md"
              fullWidth
              onPress={onClose}
              disabled={busy}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ====================================================================
// 小さな部品
// ====================================================================
function WeeklyStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'ink' | 'emerald' | 'amber' | 'red';
}) {
  const color =
    tone === 'emerald'
      ? '#059669'
      : tone === 'amber'
        ? '#B45309'
        : tone === 'red'
          ? '#DC2626'
          : Ink[700];
  return (
    <View style={styles.weeklyStatWrap}>
      <Text style={styles.weeklyStatLabel}>{label}</Text>
      <Text style={[styles.weeklyStatValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },
  errorText: { color: Accent.red, fontSize: 12, marginTop: 10 },

  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  healthLabel: { fontSize: 11, color: Ink[500], fontWeight: '600' },
  healthValue: { fontSize: 17, fontWeight: '800', color: Ink[900], marginTop: 2 },
  healthStatusWrap: { marginLeft: 'auto' },

  divider: { height: 1, backgroundColor: Ink[100], marginVertical: 12 },

  weeklyCaption: {
    fontSize: 10,
    color: Ink[500],
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  weeklyRow: { flexDirection: 'row', gap: 10 },
  weeklyStatWrap: {
    flex: 1,
    backgroundColor: Ink[50],
    padding: 10,
    borderRadius: Radius.sm,
  },
  weeklyStatLabel: { fontSize: 10, color: Ink[500], fontWeight: '600' },
  weeklyStatValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },

  syncHint: {
    fontSize: 11,
    color: Ink[500],
    lineHeight: 16,
    marginTop: 10,
    backgroundColor: 'rgba(30,58,95,0.04)',
    padding: 10,
    borderRadius: Radius.sm,
  },

  groupHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  compNameText: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  groupMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  bcartIdText: {
    fontSize: 10,
    color: Ink[400],
    marginTop: 2,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  groupYen: { fontSize: 16, fontWeight: '800', color: Brand.gold },

  moreHint: { fontSize: 11, color: Ink[400], textAlign: 'center', marginTop: 8 },

  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleArrow: { fontSize: 14, color: Ink[400], marginTop: 20 },

  linkedHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  linkedName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  linkedSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  linkedYen: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  linkedStats: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Ink[100],
  },
  linkedStat: { fontSize: 11, color: Ink[600] },
  statStrong: { fontWeight: '800', color: Ink[900] },
  memberChip: {
    fontSize: 10,
    color: Ink[500],
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },
  unlinkBtn: { marginTop: 10, alignSelf: 'flex-start' },
  unlinkText: { fontSize: 11, color: Accent.red, fontWeight: '700' },

  logDate: { fontSize: 11, color: Ink[600] },
  logStats: { fontSize: 11, color: Ink[700], marginTop: 6 },
  logError: { fontSize: 10, color: Accent.red, marginTop: 4, fontFamily: 'monospace' },

  emptyHint: { fontSize: 12, color: Ink[500], textAlign: 'center', padding: 12 },

  // Modal
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
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Ink[900] },
  modalSub: { fontSize: 12, color: Ink[500], marginTop: 2 },
  searchInput: {
    marginTop: 14,
    padding: 12,
    backgroundColor: Ink[50],
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    fontSize: 14,
    color: Ink[900],
  },
  modalList: { marginTop: 12, maxHeight: 320 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
    gap: 8,
  },
  modalRowName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  modalRowSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  modalRowArrow: { fontSize: 20, color: Ink[300] },
});
