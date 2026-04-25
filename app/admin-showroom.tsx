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
  resolveUnmatchedBooking,
  updateInvitationStatus,
  useLineShowroom,
  type UnmatchedBookingRow,
} from '@/hooks/use-line-showroom';
import { useProfile } from '@/hooks/use-profile';
import { jpy } from '@/lib/format';
import { supabase } from '@/lib/supabase';

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
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}
function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  });
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
}

export default function AdminShowroomScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const isAdmin = profile?.role === 'admin';

  const { data, loading, error, reload } = useLineShowroom();
  const [picker, setPicker] = useState<UnmatchedBookingRow | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  if (!isAdmin) {
    return (
      <Screen back>
        <Text style={styles.errorText}>管理者のみ利用可能です</Text>
      </Screen>
    );
  }

  // 日付別にグルーピング（カレンダー表示の代わり）
  const groupedByDate = useMemo(() => {
    if (!data?.upcomingInvitations) return [];
    const groups = new Map<string, typeof data.upcomingInvitations>();
    for (const inv of data.upcomingInvitations) {
      if (!inv.scheduled_at) continue;
      const dateKey = inv.scheduled_at.slice(0, 10);
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(inv);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <Screen back>
      <Text style={styles.title}>ショールーム予約管理</Text>
      <Text style={styles.sub}>恵比寿ショールーム ／ LINE予約連携</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading || !data ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          <ShimmerCard /><ShimmerCard />
        </View>
      ) : (
        <>
          {/* ── 1. 同期ヘルスチェック ── */}
          <SectionTitle title="LINE同期ヘルスチェック" style={{ marginTop: 20 }} />
          <Card variant="surface" padding={14} style={{ marginBottom: 14 }}>
            <View style={styles.healthRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.healthLabel}>最終同期</Text>
                <Text style={styles.healthValue}>
                  {data.lastSync ? relativeTime(data.lastSync.sync_started_at) : '未実行'}
                </Text>
              </View>
              {data.lastSync ? (
                <Badge
                  label={data.lastSync.status === 'success' ? '✓ 成功'
                       : data.lastSync.status === 'failed' ? '✕ 失敗' : '実行中'}
                  tone={data.lastSync.status === 'success' ? 'emerald'
                       : data.lastSync.status === 'failed' ? 'red' : 'amber'}
                />
              ) : null}
            </View>
            <View style={styles.divider} />
            <Text style={styles.weeklyCaption}>直近7日</Text>
            <View style={styles.weeklyRow}>
              <Stat label="取得" v={data.weekly.fetched} tone="ink" />
              <Stat label="マッチ" v={data.weekly.matched} tone="emerald" />
              <Stat label="未マッチ" v={data.weekly.unmatched} tone="amber" />
              <Stat label="キャンセル" v={data.weekly.cancelled} tone="ink" />
            </View>
            <Text style={styles.syncHint}>
              同期は <Text style={{ fontWeight: '700' }}>npm run sync:line</Text> をターミナルで実行。
              もしくはタスクスケジューラ登録で自動化。
            </Text>
            <View style={{ marginTop: 10 }}>
              <Button label="🔄 状態を再読み込み" variant="secondary" size="sm" onPress={reload} />
            </View>
          </Card>

          {/* ── 2. 未マッチ予約 ── */}
          <SectionTitle
            title="未マッチの LINE予約"
            caption={`${data.unmatched.length} 件 ／ 顧客に紐付け要`}
            style={{ marginTop: 8 }}
          />
          {data.unmatched.length === 0 ? (
            <EmptyState icon="📭" title="未マッチなし"
              message="LINE予約は全て担当顧客に紐付いています" />
          ) : (
            <View style={{ gap: 10 }}>
              {data.unmatched.slice(0, 20).map((u) => (
                <Card key={u.id} variant="surface" padding={14} style={{ gap: 8 }}>
                  <View style={styles.unmHead}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.unmCompany}>
                        {u.visitor_company ?? '(会社名なし)'}
                        {u.visitor_contact_name ? `／${u.visitor_contact_name}様` : ''}
                      </Text>
                      <Text style={styles.unmMeta}>
                        📅 {fmtDateTime(u.scheduled_at)}
                        {u.num_visitors ? `　👥 ${u.num_visitors}名` : ''}
                      </Text>
                      {u.visitor_phone ? (
                        <Text style={styles.unmMeta}>📞 {u.visitor_phone}</Text>
                      ) : null}
                      {u.visitor_business_type ? (
                        <Text style={styles.unmMeta}>🏪 {u.visitor_business_type}</Text>
                      ) : null}
                      {u.interest_products && u.interest_products.length > 0 ? (
                        <Text style={styles.unmMeta}>
                          🎯 {u.interest_products.join('・')}
                        </Text>
                      ) : null}
                      {u.visitor_notes ? (
                        <Text style={styles.unmNotes}>💬 {u.visitor_notes}</Text>
                      ) : null}
                    </View>
                  </View>
                  <Button
                    label="顧客 ＆ レンジャーに紐付け"
                    variant="primary"
                    size="md"
                    fullWidth
                    onPress={() => setPicker(u)}
                  />
                </Card>
              ))}
            </View>
          )}

          {/* ── 3. 予約一覧（日付別） ── */}
          <SectionTitle
            title="今後の来場予定"
            caption={`${data.upcomingInvitations.length} 件`}
            style={{ marginTop: 20 }}
          />
          {groupedByDate.length === 0 ? (
            <EmptyState icon="📅" title="今後の予定はありません" message="" />
          ) : (
            <View style={{ gap: 14 }}>
              {groupedByDate.map(([dateKey, invs]) => (
                <View key={dateKey}>
                  <Text style={styles.dateHeader}>{fmtDate(dateKey)}</Text>
                  <View style={{ gap: 8 }}>
                    {invs.map((inv) => (
                      <Card key={inv.id} variant="surface" padding={12}>
                        <View style={styles.invRow}>
                          <Text style={styles.invTime}>
                            {inv.scheduled_at ? new Date(inv.scheduled_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </Text>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <View style={styles.invTitleRow}>
                              <Text style={styles.invCustomer} numberOfLines={1}>
                                {inv.customer_name}
                              </Text>
                              {inv.source === 'line' ? (
                                <View style={styles.lineTag}>
                                  <Text style={styles.lineTagText}>LINE</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={styles.invMeta} numberOfLines={1}>
                              {inv.ranger_name ? `担当：${inv.ranger_name}` : ''}
                              {inv.num_visitors ? ` / ${inv.num_visitors}名` : ''}
                            </Text>
                          </View>
                          <View style={styles.invActions}>
                            <Badge
                              label={
                                inv.status === 'invited' ? '招待済' :
                                inv.status === 'confirmed' ? '確定' :
                                inv.status === 'visited' ? '来場済' : '中止'
                              }
                              tone={
                                inv.status === 'confirmed' ? 'emerald' :
                                inv.status === 'visited' ? 'navy' :
                                inv.status === 'invited' ? 'amber' : 'neutral'
                              }
                            />
                            {inv.status === 'invited' ? (
                              <Pressable
                                onPress={() => {
                                  confirmDialog(`「${inv.customer_name}」を確定にしますか？`, async () => {
                                    const r = await updateInvitationStatus(inv.id, 'confirmed');
                                    if (r.ok) { notify('✅ 確定にしました'); reload(); }
                                    else notify(`エラー: ${r.error}`);
                                  });
                                }}
                                style={styles.smallBtn}
                              >
                                <Text style={styles.smallBtnText}>確定</Text>
                              </Pressable>
                            ) : null}
                            {inv.status === 'confirmed' ? (
                              <Pressable
                                onPress={() => {
                                  confirmDialog(`「${inv.customer_name}」を来場済にしますか？`, async () => {
                                    const r = await updateInvitationStatus(inv.id, 'visited');
                                    if (r.ok) { notify('✅ 来場済にしました'); reload(); }
                                    else notify(`エラー: ${r.error}`);
                                  });
                                }}
                                style={[styles.smallBtn, { backgroundColor: Brand.navy }]}
                              >
                                <Text style={[styles.smallBtnText, { color: '#fff' }]}>来場済</Text>
                              </Pressable>
                            ) : null}
                          </View>
                        </View>
                        {inv.interest_products && inv.interest_products.length > 0 ? (
                          <Text style={styles.invInterest}>
                            🎯 {inv.interest_products.join('・')}
                          </Text>
                        ) : null}
                      </Card>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── 4. 同期ログ（折りたたみ） ── */}
          <Pressable onPress={() => setShowLogs((v) => !v)} style={styles.toggleRow}>
            <SectionTitle title="同期ログ（デバッグ用）" style={{ flex: 1, marginTop: 20 }} />
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
                        tone={l.status === 'success' ? 'emerald' : l.status === 'failed' ? 'red' : 'amber'}
                      />
                      <Text style={styles.logDate}>{relativeTime(l.sync_started_at)}</Text>
                    </View>
                    <Text style={styles.logStats}>
                      取得 {l.fetched} ／ マッチ {l.matched} ／ 未マッチ {l.unmatched} ／ キャンセル {l.cancelled} ／ 重複 {l.duplicated}
                    </Text>
                    {l.error_message ? <Text style={styles.logError}>{l.error_message}</Text> : null}
                  </Card>
                ))
              )}
            </View>
          ) : null}
        </>
      )}

      {/* ── 紐付けモーダル ── */}
      {picker ? (
        <UnmatchedPickerModal
          unmatched={picker}
          onClose={() => setPicker(null)}
          onResolved={() => {
            setPicker(null);
            reload();
          }}
        />
      ) : null}
    </Screen>
  );
}

// ====================================================================
// 紐付け（顧客 + レンジャー選択）モーダル
// ====================================================================
function UnmatchedPickerModal({
  unmatched,
  onClose,
  onResolved,
}: {
  unmatched: UnmatchedBookingRow;
  onClose: () => void;
  onResolved: () => void;
}) {
  const { customers } = useCustomers();
  const [query, setQuery] = useState(unmatched.visitor_company ?? '');
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; ranger_id: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 30);
    return customers
      .filter((c) => `${c.name} ${c.branch_name ?? ''}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [customers, query]);

  async function pickCustomer(c: typeof customers[number]) {
    setError(null);
    // assigned_ranger_id を取りに行く
    const { data, error: err } = await supabase
      .from('customers')
      .select('id, assigned_ranger_id')
      .eq('id', c.id)
      .maybeSingle();
    if (err) { setError(err.message); return; }
    if (!data?.assigned_ranger_id) {
      setError('この顧客には担当レンジャーが未設定です');
      return;
    }
    setSelectedCustomer({ id: data.id, ranger_id: data.assigned_ranger_id });
  }

  async function confirm() {
    if (!selectedCustomer) return;
    setBusy(true);
    const r = await resolveUnmatchedBooking(unmatched.id, selectedCustomer.id, selectedCustomer.ranger_id!);
    setBusy(false);
    if (!r.ok) { setError(r.error ?? '紐付け失敗'); return; }
    notify('✅ 紐付けました');
    onResolved();
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>顧客に紐付け</Text>
          <Text style={styles.modalSub}>
            {unmatched.visitor_company ?? '(会社名なし)'}
            {unmatched.visitor_contact_name ? `／${unmatched.visitor_contact_name}様` : ''}
          </Text>
          <Text style={styles.modalSub}>📅 {fmtDateTime(unmatched.scheduled_at)}</Text>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="顧客名・支店で検索"
            placeholderTextColor={Ink[400]}
            style={styles.searchInput}
          />

          {error ? <Text style={styles.modalError}>{error}</Text> : null}

          {selectedCustomer ? (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>選択中の顧客で紐付けますか？</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Button label="戻る" variant="secondary" size="md" fullWidth
                    onPress={() => { setSelectedCustomer(null); setError(null); }}
                    disabled={busy}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Button label="紐付け実行" variant="primary" size="md" fullWidth
                    loading={busy} onPress={confirm}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.modalList}>
              {filtered.length === 0 ? (
                <Text style={styles.emptyHint}>該当なし</Text>
              ) : (
                filtered.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => pickCustomer(c)}
                    style={({ pressed }) => [styles.modalRow, pressed && { backgroundColor: Ink[100] }]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.modalRowName}>{c.name}</Text>
                      {c.branch_name ? (
                        <Text style={styles.modalRowSub} numberOfLines={1}>{c.branch_name}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.modalRowArrow}>›</Text>
                  </Pressable>
                ))
              )}
            </View>
          )}

          <View style={{ marginTop: 12 }}>
            <Button label="キャンセル" variant="secondary" size="md" fullWidth onPress={onClose} disabled={busy} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ====================================================================
// 部品
// ====================================================================
function Stat({ label, v, tone }: { label: string; v: number; tone: 'ink' | 'emerald' | 'amber' | 'red' }) {
  const color =
    tone === 'emerald' ? '#059669' :
    tone === 'amber' ? '#B45309' :
    tone === 'red' ? '#DC2626' : Ink[700];
  return (
    <View style={styles.statWrap}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{v}</Text>
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
  divider: { height: 1, backgroundColor: Ink[100], marginVertical: 12 },
  weeklyCaption: { fontSize: 10, color: Ink[500], fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  weeklyRow: { flexDirection: 'row', gap: 10 },
  statWrap: { flex: 1, backgroundColor: Ink[50], padding: 10, borderRadius: Radius.sm },
  statLabel: { fontSize: 10, color: Ink[500], fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  syncHint: { fontSize: 11, color: Ink[500], lineHeight: 16, marginTop: 10, backgroundColor: 'rgba(30,58,95,0.04)', padding: 10, borderRadius: Radius.sm },

  unmHead: { flexDirection: 'row', gap: 10 },
  unmCompany: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  unmMeta: { fontSize: 12, color: Ink[600], marginTop: 3 },
  unmNotes: { fontSize: 11, color: Ink[700], marginTop: 6, fontStyle: 'italic', backgroundColor: Ink[50], padding: 8, borderRadius: 6 },

  dateHeader: { fontSize: 13, fontWeight: '800', color: Brand.gold, marginBottom: 6, marginTop: 4, letterSpacing: 1 },
  invRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  invTime: { fontSize: 14, fontWeight: '800', color: Ink[900], minWidth: 50 },
  invTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  invCustomer: { fontSize: 13, fontWeight: '800', color: Ink[900], flex: 1 },
  invMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  invInterest: { fontSize: 11, color: Ink[600], marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Ink[100] },
  invActions: { gap: 6, alignItems: 'flex-end' },

  lineTag: { backgroundColor: 'rgba(0,180,80,0.12)', borderColor: '#06C755', borderWidth: 1, borderRadius: 4, paddingVertical: 1, paddingHorizontal: 5 },
  lineTagText: { color: '#06C755', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  smallBtn: { backgroundColor: Brand.gold, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  smallBtnText: { fontSize: 11, fontWeight: '800', color: Ink[900] },

  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  toggleArrow: { fontSize: 14, color: Ink[400], marginTop: 20 },

  logDate: { fontSize: 11, color: Ink[600] },
  logStats: { fontSize: 11, color: Ink[700], marginTop: 6 },
  logError: { fontSize: 10, color: Accent.red, marginTop: 4, fontFamily: 'monospace' },
  emptyHint: { fontSize: 12, color: Ink[500], textAlign: 'center', padding: 12 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,35,64,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 20, width: '100%', maxWidth: 440, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Ink[900] },
  modalSub: { fontSize: 12, color: Ink[500], marginTop: 2 },
  modalError: { fontSize: 12, color: Accent.red, marginTop: 8 },
  searchInput: { marginTop: 14, padding: 12, backgroundColor: Ink[50], borderWidth: 1, borderColor: Ink[200], borderRadius: Radius.md, fontSize: 14, color: Ink[900] },
  modalList: { marginTop: 12, maxHeight: 320 },
  modalRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Ink[100], gap: 8 },
  modalRowName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  modalRowSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  modalRowArrow: { fontSize: 20, color: Ink[300] },
  confirmBox: { marginTop: 14, padding: 14, backgroundColor: Ink[50], borderRadius: Radius.md },
  confirmText: { fontSize: 13, color: Ink[900], fontWeight: '700' },
});
