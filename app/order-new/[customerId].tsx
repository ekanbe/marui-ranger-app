import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCustomerDetail } from '@/hooks/use-customer-detail';
import { useProducts } from '@/hooks/use-products';
import { jpy } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export default function NewOrderScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { session } = useAuth();
  const { detail, loading: cLoading } = useCustomerDetail(customerId);
  const { products, loading: pLoading } = useProducts();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const product = products.find((p) => p.id === selectedProductId);
  const quantityNum = Math.max(0, Math.floor(Number(quantity) || 0));
  const subtotal = product ? product.unit_price_jpy * quantityNum : 0;
  const commission = Math.round(subtotal * 0.02);

  async function submit() {
    if (!product || !customerId || !session || quantityNum <= 0) return;
    setSubmitting(true);
    setError(null);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    const orderCode = `ORD-${dateStr}-${rand}`;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        tenant_id: '00000000-0000-0000-0000-000000000001',
        order_code: orderCode,
        customer_id: customerId,
        ranger_id: session.user.id,
        ordered_at: now.toISOString(),
        status: 'pending',
        total_amount_jpy: subtotal,
      })
      .select('id')
      .single();

    if (orderErr || !order) {
      setError(orderErr?.message ?? 'orders insert 失敗');
      setSubmitting(false);
      return;
    }

    const { error: itemErr } = await supabase.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      quantity: quantityNum,
      unit_price_jpy: product.unit_price_jpy,
      subtotal_jpy: subtotal,
    });

    if (itemErr) {
      // 補償トランザクション: 明細の登録に失敗したら親受注を削除して孤児受注・二重受注を防ぐ
      const { error: rollbackErr } = await supabase.from('orders').delete().eq('id', order.id);
      setSubmitting(false);
      setError(
        rollbackErr
          ? `${itemErr.message}（受注の取消にも失敗しました。管理者に受注番号 ${orderCode} を連絡してください）`
          : `明細の登録に失敗したため、受注を取り消しました。もう一度お試しください。（${itemErr.message}）`
      );
      return;
    }
    setSubmitting(false);

    const message = `📝 受注を登録しました\n\n管理者の承認後、報酬 ${jpy(commission)} が確定します。`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(message);
    } else {
      Alert.alert('完了', message);
    }
    router.back();
  }

  if (cLoading || pLoading) {
    return (
      <Screen back>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen back>
        <EmptyState
          icon="🏪"
          title="顧客が見つかりません"
          message="顧客が削除されたか、リンクが無効になっている可能性があります"
          actionLabel="戻る"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen back>
      <Text style={styles.title}>新規受注</Text>
      {detail ? (
        <View style={styles.customerBanner}>
          <View style={styles.customerBannerThumbWrap}>
            {detail.image_url ? (
              <Image source={{ uri: detail.image_url }} style={styles.customerBannerThumb} contentFit="cover" />
            ) : (
              <View style={[styles.customerBannerThumb, styles.customerBannerThumbPlaceholder]}><Text style={{ fontSize: 22 }}>🏪</Text></View>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>
              {detail.name}
              {detail.branch_name ? ` ${detail.branch_name}` : ''}
            </Text>
            <Text style={styles.customerMeta}>{detail.business_type ?? '—'}</Text>
          </View>
        </View>
      ) : null}

      <SectionTitle title="商品を選択" caption={`${products.length} 商品`} />
      <View style={{ gap: 10, marginBottom: 18 }}>
        {products.map((p) => {
          const selected = selectedProductId === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setSelectedProductId(p.id)}
              style={({ pressed }) => [
                styles.productRow,
                selected && styles.productRowSelected,
                pressed && !selected && { opacity: 0.85 },
              ]}
            >
              <View style={styles.productImageWrap}>
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.productImage} contentFit="cover" />
                ) : (
                  <View style={[styles.productImage, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 20 }}>📦</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.productName, selected && { color: Ink[900] }]} numberOfLines={2}>
                  {p.name}
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  {p.category ? <Badge label={p.category} tone="neutral" /> : null}
                </View>
                <Text style={[styles.productPrice, selected && { color: Ink[900] }]}>
                  {jpy(p.unit_price_jpy)}
                </Text>
              </View>
              {selected ? <Text style={styles.checkMark}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="数量" />
      <View style={styles.qtyRow}>
        <Pressable
          onPress={() => setQuantity(String(Math.max(0, quantityNum - 1)))}
          style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
        >
          <Text style={styles.qtyBtnText}>-</Text>
        </Pressable>
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="1"
          placeholderTextColor={Ink[400]}
          style={styles.qtyInput}
        />
        <Pressable
          onPress={() => setQuantity(String(quantityNum + 1))}
          style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </Pressable>
      </View>

      {/* 合計 */}
      <View style={styles.totalBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>小計</Text>
          <Text style={styles.totalValue}>{jpy(subtotal)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.commissionIcon}>💰</Text>
            <Text style={styles.commissionLabel}>自分の報酬（2%）</Text>
          </View>
          <Text style={styles.commissionValue}>{jpy(commission)}</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

      <Button
        label="受注を登録"
        variant="cta"
        size="lg"
        fullWidth
        loading={submitting}
        disabled={!product || quantityNum <= 0}
        onPress={submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },

  customerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30,58,95,0.04)',
    borderRadius: Radius.md,
    padding: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  customerBannerThumbWrap: {
    width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
    backgroundColor: Ink[100],
  },
  customerBannerThumb: { width: 52, height: 52 },
  customerBannerThumbPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(30,58,95,0.04)',
  },
  customerName: { fontSize: 15, fontWeight: '800', color: Ink[900] },
  customerMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  productRowSelected: {
    borderColor: Brand.navy,
    borderWidth: 2,
    backgroundColor: 'rgba(30,58,95,0.04)',
  },
  productImageWrap: {
    width: 56, height: 56, borderRadius: Radius.sm, overflow: 'hidden', backgroundColor: Ink[100],
  },
  productImage: { width: 56, height: 56 },
  productName: { fontSize: 13, fontWeight: '700', color: Ink[900], lineHeight: 17 },
  productPrice: { fontSize: 15, fontWeight: '800', color: Ink[700], marginTop: 6 },
  checkMark: { fontSize: 22, color: Brand.navy, fontWeight: '900' },

  qtyRow: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  qtyBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Brand.navy,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  qtyBtnPressed: { opacity: 0.75 },
  qtyBtnText: { fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 30 },
  qtyInput: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '800',
    color: Ink[900],
    textAlign: 'center',
  },

  totalBox: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.lg,
    padding: 18,
    marginBottom: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  totalValue: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  totalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
  commissionIcon: { fontSize: 14 },
  commissionLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  commissionValue: { color: Accent.emeraldLight, fontSize: 18, fontWeight: '800' },

  error: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(239,68,68,0.06)',
    padding: 10,
    borderRadius: Radius.sm,
  },
});
