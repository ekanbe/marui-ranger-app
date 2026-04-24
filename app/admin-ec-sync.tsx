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

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCustomers } from '@/hooks/use-customers';
import {
  linkMemberIdToCustomer,
  markAsDirectSale,
  unlinkMemberId,
  useEcSync,
  type UnmatchedGroup,
} from '@/hooks/use-ec-sync';
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

export default function AdminEcSyncScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const isAdmin = profile?.role === 'admin';

  const { data, loading, error, reload } = useEcSync();

  const [pickerGroup, setPickerGroup] = useState<UnmatchedGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLinked, setShowLinked] = useState(true);

  if (!isAdmin) {
    return (
      <Screen back>
        <Text style={styles.errorText}>管理者のみ利用可能です</Text>
      </Screen>
    );
  }

  return (
    <Screen back>
      <Text style={styles.title}>EC同期管理</Text>
      <Text style={styles.sub}>foodboat.jp（MakeShop）との連携状況</Text>

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
                <Text style={styles.healthLabel}>最終同期</Text>
                <Text style={styles.healthValue}>
                  {data.lastSync ? relativeTime(data.lastSync.sync_started_at) : '未実行'}
                </Text>
              </View>
              <View style={styles.healthStatusWrap}>
                {data.lastSync ? (
                  <Badge
                    label={
                      data.lastSync.status === 'success'
                        ? '✓ 成功'
                        : data.lastSync.status === 'failed'
                          ? '✕ 失敗'
                          : '実行中'
                    }
                    tone={
                      data.lastSync.status === 'success'
                        ? 'emerald'
                        : data.lastSync.status === 'failed'
                          ? 'red'
                          : 'amber'
                    }
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.weeklyCaption}>直近7日の同期成果</Text>
            <View style={styles.weeklyRow}>
              <WeeklyStat label="取得" value={data.weekly.fetched} tone="ink" />
              <WeeklyStat label="マッチ" value={data.weekly.matched} tone="emerald" />
              <WeeklyStat label="未マッチ" value={data.weekly.unmatched} tone="amber" />
              <WeeklyStat label="重複" value={data.weekly.duplicated} tone="ink" />
            </View>

            <Text style={styles.syncHint}>
              同期はサーバー側の自動ジョブで実行されます。手動で即時実行したい場合は
              <Text style={{ fontWeight: '700' }}> npm run sync:makeshop </Text>
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

          {/* ── セクション2: 未マッチキュー ─────────────── */}
          <SectionTitle
            title="未マッチの注文"
            caption={`${data.unmatchedGroups.length} 人の顧客候補（memberIdベース）`}
            style={{ marginTop: 8 }}
          />

          {data.unmatchedGroups.length === 0 ? (
            <EmptyState
              icon="📭"
              title="未マッチの注文はありません"
              message="同期で紐付けできなかった注文がここに表示されます"
            />
          ) : (
            <View style={{ gap: 10 }}>
              {data.unmatchedGroups.slice(0, 50).map((g) => (
                <Card
                  key={g.ec_member_id ?? 'guest'}
                  variant="surface"
                  padding={14}
                  style={{ gap: 10 }}
                >
                  <View style={styles.groupHead}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.memberIdText} numberOfLines={1}>
                        memberId: {g.ec_member_id ?? '(ゲスト購入)'}
                      </Text>
                      <Text style={styles.groupMeta}>
                        {g.order_count} 件 ／ 最新 {shortDate(g.latest_date)}
                      </Text>
                    </View>
                    <Text style={styles.groupYen}>{jpy(g.total_yen)}</Text>
                  </View>

                  <View style={styles.groupActions}>
                    <View style={{ flex: 3 }}>
                      <Button
                        label="顧客に紐付ける"
                        variant="primary"
                        size="md"
                        fullWidth
                        disabled={!g.ec_member_id}
                        onPress={() => setPickerGroup(g)}
                      />
                    </View>
                    <View style={{ flex: 2 }}>
                      <Button
                        label="直販扱い"
                        variant="secondary"
                        size="md"
                        fullWidth
                        disabled={!g.ec_member_id}
                        onPress={() => {
                          if (!g.ec_member_id) return;
                          confirmDialog(
                            `memberId=${g.ec_member_id} の注文を「直販（レンジャー対象外）」として非表示にします。よろしいですか？`,
                            async () => {
                              setBusy(true);
                              const r = await markAsDirectSale(g.ec_member_id!);
                              setBusy(false);
                              if (r.ok) {
                                notify('✅ 直販扱いにしました');
                                reload();
                              } else {
                                notify('エラー: ' + r.error);
                              }
                            }
                          );
                        }}
                      />
                    </View>
                  </View>
                </Card>
              ))}
              {data.unmatchedGroups.length > 50 ? (
                <Text style={styles.moreHint}>
                  上位50件まで表示中（全{data.unmatchedGroups.length}件）
                </Text>
              ) : null}
            </View>
          )}

          {/* ── セクション3: 紐付け済み顧客（折りたたみ） ─── */}
          <Pressable onPress={() => setShowLinked((v) => !v)} style={styles.toggleRow}>
            <SectionTitle
              title={`EC紐付け済み顧客（${data.linkedCustomers.length}）`}
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
                          紐付け: {shortDate(c.ec_linked_at)}
                        </Text>
                      </View>
                      <Text style={styles.linkedYen}>{jpy(c.ec_total_yen)}</Text>
                    </View>

                    <View style={styles.linkedStats}>
                      <Text style={styles.linkedStat}>
                        EC注文 <Text style={styles.statStrong}>{c.ec_order_count}</Text>件
                      </Text>
                      <Text style={styles.linkedStat}>
                        報酬累計 <Text style={styles.statStrong}>{jpy(c.ec_commission_yen)}</Text>
                      </Text>
                      <Text style={styles.memberChip}>
                        ID: {c.ec_member_id}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => {
                        confirmDialog(
                          `${c.customer_name} のEC紐付けを解除します。よろしいですか？\n\n※既に生成された受注・報酬は残ります`,
                          async () => {
                            setBusy(true);
                            const r = await unlinkMemberId(c.customer_id);
                            setBusy(false);
                            if (r.ok) {
                              notify('✅ 紐付けを解除しました');
                              reload();
                            } else {
                              notify('エラー: ' + r.error);
                            }
                          }
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
                      取得 {l.orders_fetched} / マッチ {l.orders_matched} / 未マッチ {l.orders_unmatched} / 重複 {l.orders_duplicated}
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
      {pickerGroup ? (
        <CustomerPickerModal
          group={pickerGroup}
          busy={busy}
          onClose={() => setPickerGroup(null)}
          onConfirm={async (customerId) => {
            if (!pickerGroup.ec_member_id) return;
            setBusy(true);
            const r = await linkMemberIdToCustomer(pickerGroup.ec_member_id, customerId);
            setBusy(false);
            if (!r.ok) {
              notify('エラー: ' + r.error);
              return;
            }
            setPickerGroup(null);
            notify('✅ 紐付けました\n\n' + (r.syncHint ?? ''));
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
  group,
  busy,
  onClose,
  onConfirm,
}: {
  group: UnmatchedGroup;
  busy: boolean;
  onClose: () => void;
  onConfirm: (customerId: string) => void;
}) {
  const { customers, loading } = useCustomers();
  const [query, setQuery] = useState('');

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
            memberId: <Text style={{ fontWeight: '700' }}>{group.ec_member_id}</Text>
          </Text>
          <Text style={styles.modalSub}>
            {group.order_count}件 / {jpy(group.total_yen)}
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
                      `${c.name} に memberId=${group.ec_member_id} を紐付けます。\n` +
                        `${group.order_count}件 (${jpy(group.total_yen)}) の過去注文が、次回同期でレンジャー報酬に反映されます。`,
                      () => onConfirm(c.id)
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

  weeklyCaption: { fontSize: 10, color: Ink[500], fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  weeklyRow: { flexDirection: 'row', gap: 10 },
  weeklyStatWrap: { flex: 1, backgroundColor: Ink[50], padding: 10, borderRadius: Radius.sm },
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
  memberIdText: { fontSize: 13, fontWeight: '800', color: Ink[900] },
  groupMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  groupYen: { fontSize: 16, fontWeight: '800', color: Brand.gold },

  groupActions: { flexDirection: 'row', gap: 8 },

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
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
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
