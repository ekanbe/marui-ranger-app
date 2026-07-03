import { Image } from 'expo-image';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AdminGuard } from '@/components/admin/AdminGuard';
import { Screen } from '@/components/ranger/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerList } from '@/components/ui/Shimmer';
import { Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usePendingApprovals, type PendingOrder } from '@/hooks/use-pending-approvals';
import { useProfile } from '@/hooks/use-profile';
import { jpy, shortDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export default function ApprovalsScreen() {
  const { session } = useAuth();
  const { profile, loading: profileLoading } = useProfile(session);
  const isAdmin = profile?.role === 'admin';
  const { orders, loading, error: loadError, reload } = usePendingApprovals(session);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<PendingOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (profileLoading || !isAdmin) {
    return <AdminGuard loading={profileLoading} />;
  }

  async function approve(order: PendingOrder) {
    setBusyId(order.id);
    setError(null);
    const { error: err } = await supabase.rpc('fn_approve_order', { p_order_id: order.id });
    setBusyId(null);
    if (err) {
      setError(`承認失敗: ${err.message}`);
      return;
    }
    notify(`✅ 承認しました: ${order.customer_name}`);
    reload();
  }

  async function confirmReject() {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    setError(null);
    const { error: err } = await supabase.rpc('fn_reject_order', {
      p_order_id: rejecting.id,
      p_reason: rejectReason.trim() || null,
    });
    setBusyId(null);
    if (err) {
      setError(`却下失敗: ${err.message}`);
      return;
    }
    notify(`✕ 却下しました: ${rejecting.customer_name}`);
    setRejecting(null);
    setRejectReason('');
    reload();
  }

  function notify(msg: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert('完了', msg);
    }
  }

  // 却下確認モーダル風
  if (rejecting) {
    return (
      <Screen back>
        <Text style={styles.title}>受注を却下</Text>
        <Text style={styles.sub}>
          {rejecting.customer_name}・¥{rejecting.total_amount_jpy.toLocaleString('ja-JP')}
        </Text>

        <SectionTitle title="却下理由" caption="レンジャーに通知されます" style={{ marginTop: 20 }} />
        <TextInput
          value={rejectReason}
          onChangeText={setRejectReason}
          placeholder="例：入金確認できず"
          placeholderTextColor={Ink[400]}
          multiline
          style={styles.textarea}
        />

        {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

        <View style={styles.actionRow}>
          <View style={{ flex: 1 }}>
            <Button
              label="戻る"
              variant="secondary"
              size="lg"
              fullWidth
              onPress={() => {
                setRejecting(null);
                setRejectReason('');
              }}
              disabled={busyId !== null}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="却下を確定"
              variant="danger"
              size="lg"
              fullWidth
              loading={busyId !== null}
              onPress={confirmReject}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen back>
      <Text style={styles.title}>承認待ちの受注</Text>
      <Text style={styles.sub}>
        {loading ? '読み込み中...' : `${orders.length} 件の承認待ち`}
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ marginTop: 16 }}>
        {loading ? (
          <ShimmerList count={3} />
        ) : loadError ? (
          <EmptyState
            icon="⚠️"
            title="読み込みに失敗しました"
            message={loadError}
            actionLabel="再読み込み"
            onAction={reload}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="✅"
            title="承認待ちはありません"
            message="新しい受注が入ると、ここに表示されます"
          />
        ) : (
          <View style={{ gap: 12 }}>
            {orders.map((o) => (
              <Card key={o.id} variant="surface" padding={14}>
                <View style={styles.row}>
                  <View style={styles.thumbWrap}>
                    {o.customer_image_url ? (
                      <Image source={{ uri: o.customer_image_url }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <Text style={{ fontSize: 20 }}>🏪</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.customerName}>{o.customer_name}</Text>
                    <Text style={styles.meta}>{o.product_name} × {o.quantity}</Text>
                    <Text style={styles.meta}>
                      受注: {shortDate(o.ordered_at)}・登録: {o.ranger_name}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{jpy(o.total_amount_jpy)}</Text>
                </View>

                <View style={styles.btnRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="✕ 却下"
                      variant="secondary"
                      size="md"
                      fullWidth
                      onPress={() => setRejecting(o)}
                      disabled={busyId !== null}
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Button
                      label="✓ 承認"
                      variant="primary"
                      size="md"
                      fullWidth
                      loading={busyId === o.id}
                      onPress={() => approve(o)}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },

  row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  thumbWrap: { width: 52, height: 52, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Ink[100] },
  thumb: { width: 52, height: 52 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30,58,95,0.04)' },

  customerName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  meta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '800', color: Ink[900] },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },

  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Ink[900],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 24 },

  error: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 14,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: Radius.sm,
    textAlign: 'center',
  },
});
