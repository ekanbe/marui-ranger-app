import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCustomers } from '@/hooks/use-customers';
import { useProductDetail } from '@/hooks/use-product-detail';
import { createQuoteRequest } from '@/hooks/use-quote-requests';
import { jpy } from '@/lib/format';
import { supabase } from '@/lib/supabase';

function notify(msg: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(msg);
  } else {
    Alert.alert('完了', msg);
  }
}

export default function QuoteRequestNewScreen() {
  const params = useLocalSearchParams<{ product_id?: string }>();
  const productId = params.product_id;

  const { session } = useAuth();
  const { detail, loading: detailLoading } = useProductDetail(productId);
  const { customers, loading: customersLoading } = useCustomers();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [productSetId, setProductSetId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [requestedPrice, setRequestedPrice] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');

  const selectedSet = useMemo(() => {
    if (!detail || !productSetId) return detail?.bcart_sets[0] ?? null;
    return detail.bcart_sets.find((s) => s.id === productSetId) ?? null;
  }, [detail, productSetId]);

  const standardPrice = selectedSet?.unit_price ?? null;

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers.slice(0, 30);
    return customers
      .filter((c) => `${c.name}${c.branch_name ?? ''}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [customers, customerQuery]);

  if (detailLoading) {
    return (
      <Screen back>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  if (!productId || !detail) {
    return (
      <Screen back>
        <EmptyState
          icon="📦"
          title="商品が見つかりません"
          message="商品が削除されたか、リンクが無効になっている可能性があります"
          actionLabel="戻る"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const selectedCustomer = customers.find((c) => c.id === customerId);

  async function handleSubmit() {
    if (!customerId || !session?.user.id || !detail) return;
    const qty = Number(quantity) || 0;
    const reqPrice = Number(requestedPrice) || 0;
    if (qty <= 0 || reqPrice <= 0) {
      notify('数量と希望単価は正の数を入れてください');
      return;
    }
    setSubmitting(true);
    // tenant_id は customer から継承
    const { data: cust } = await supabase
      .from('customers')
      .select('tenant_id')
      .eq('id', customerId)
      .maybeSingle();
    const tenantId = (cust as { tenant_id: string } | null)?.tenant_id;
    if (!tenantId) {
      setSubmitting(false);
      notify('顧客の tenant_id が取得できません');
      return;
    }
    const res = await createQuoteRequest({
      tenant_id: tenantId,
      customer_id: customerId,
      ranger_id: session.user.id,
      product_id: detail.id,
      product_set_id: selectedSet?.id ?? null,
      quantity: qty,
      standard_price_jpy: standardPrice,
      requested_price_jpy: reqPrice,
      reason: reason.trim() || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      notify('✅ 見積依頼を起票しました。管理者の承認をお待ちください。');
      router.replace('/my-quote-requests' as any);
    } else {
      notify('エラー: ' + res.error);
    }
  }

  return (
    <Screen back>
      <Text style={styles.title}>📝 見積依頼を起票</Text>
      <Text style={styles.sub}>
        顧客と希望単価を入力してください。管理者が承認後、Bカート で見積登録されます。
      </Text>

      {/* 商品 */}
      <Card variant="surface" padding={14} style={{ marginTop: 16, gap: 6 }}>
        <Text style={styles.label}>対象商品</Text>
        <Text style={styles.productName}>{detail.name}</Text>
        {detail.bcart_sets.length > 1 ? (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>販売単位</Text>
            <View style={styles.setRow}>
              {detail.bcart_sets.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setProductSetId(s.id)}
                  style={({ pressed }) => [
                    styles.setChip,
                    (productSetId === s.id || (!productSetId && detail.bcart_sets[0]?.id === s.id)) &&
                      styles.setChipActive,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.setChipText}>
                    {s.name ?? s.product_no ?? '販売単位'}
                    {s.unit_price ? ` (${jpy(s.unit_price)})` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {standardPrice != null ? (
          <Text style={styles.standardPriceText}>
            標準単価: <Text style={styles.standardPriceValue}>{jpy(standardPrice)}</Text>
          </Text>
        ) : null}
      </Card>

      {/* 顧客 */}
      <Card variant="surface" padding={14} style={{ marginTop: 12 }}>
        <Text style={styles.label}>顧客</Text>
        {selectedCustomer ? (
          <View style={styles.selectedCustomerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedCustomerName}>{selectedCustomer.name}</Text>
              {selectedCustomer.branch_name ? (
                <Text style={styles.selectedCustomerSub}>{selectedCustomer.branch_name}</Text>
              ) : null}
            </View>
            <Pressable onPress={() => setCustomerId(null)}>
              <Text style={styles.changeBtn}>変更</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput
              value={customerQuery}
              onChangeText={setCustomerQuery}
              placeholder="店名で検索"
              placeholderTextColor={Ink[400]}
              style={styles.input}
            />
            <ScrollView style={{ maxHeight: 240, marginTop: 8 }} nestedScrollEnabled>
              {customersLoading ? (
                <Text style={styles.hint}>読み込み中...</Text>
              ) : filteredCustomers.length === 0 ? (
                <Text style={styles.hint}>該当なし</Text>
              ) : (
                filteredCustomers.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => setCustomerId(c.id)}
                    style={({ pressed }) => [
                      styles.customerRow,
                      pressed && { backgroundColor: Ink[100] },
                    ]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.customerName}>{c.name}</Text>
                      {c.branch_name ? (
                        <Text style={styles.customerSub}>{c.branch_name}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.customerArrow}>›</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </>
        )}
      </Card>

      {/* 数量 & 希望単価 */}
      <Card variant="surface" padding={14} style={{ marginTop: 12, gap: 12 }}>
        <View>
          <Text style={styles.label}>数量</Text>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            placeholderTextColor={Ink[400]}
            style={styles.input}
            keyboardType="numeric"
          />
        </View>
        <View>
          <Text style={styles.label}>希望単価 (税抜・円)</Text>
          <TextInput
            value={requestedPrice}
            onChangeText={setRequestedPrice}
            placeholder={standardPrice != null ? String(standardPrice) : '希望単価を入力'}
            placeholderTextColor={Ink[400]}
            style={styles.input}
            keyboardType="numeric"
          />
          {standardPrice != null &&
          standardPrice > 0 &&
          Number(requestedPrice) > 0 &&
          Number(requestedPrice) < standardPrice ? (
            <Text style={styles.discountHint}>
              標準より{' '}
              <Text style={styles.discountValue}>
                {Math.round((1 - Number(requestedPrice) / standardPrice) * 100)}% OFF
              </Text>
            </Text>
          ) : null}
        </View>
      </Card>

      {/* 理由 */}
      <Card variant="surface" padding={14} style={{ marginTop: 12 }}>
        <Text style={styles.label}>値引き理由 (任意)</Text>
        <Text style={styles.reasonHint}>承認判断の材料になります</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="例: 競合他社の見積を出されている、初回大口発注の見込みなど"
          placeholderTextColor={Ink[400]}
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          multiline
        />
      </Card>

      <View style={{ marginTop: 20, marginBottom: 24 }}>
        <Button
          label="📝 起票する"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!customerId || !requestedPrice || submitting}
          onPress={handleSubmit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 6, lineHeight: 18 },
  label: {
    fontSize: 10,
    color: Ink[500],
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  productName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  standardPriceText: { fontSize: 12, color: Ink[600], marginTop: 8 },
  standardPriceValue: { fontSize: 14, fontWeight: '800', color: Brand.gold },

  setRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  setChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Ink[100],
    borderRadius: 100,
  },
  setChipActive: { backgroundColor: Brand.navy },
  setChipText: { fontSize: 11, color: Ink[800], fontWeight: '600' },

  input: {
    padding: 12,
    backgroundColor: Ink[50],
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    fontSize: 14,
    color: Ink[900],
  },
  hint: { fontSize: 12, color: Ink[500], textAlign: 'center', padding: 12 },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
    gap: 8,
  },
  customerName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  customerSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  customerArrow: { fontSize: 18, color: Ink[300] },

  selectedCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(30,58,95,0.04)',
    borderRadius: Radius.sm,
    gap: 8,
  },
  selectedCustomerName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  selectedCustomerSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  changeBtn: {
    fontSize: 11,
    color: Brand.navy,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  discountHint: { fontSize: 11, color: Ink[600], marginTop: 4 },
  discountValue: { color: Accent.red, fontWeight: '800' },
  reasonHint: { fontSize: 10, color: Ink[500], marginBottom: 6 },
});
