import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/ranger/Screen';
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
        status: 'confirmed',
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

    setSubmitting(false);
    if (itemErr) {
      setError(itemErr.message);
      return;
    }

    const message = `受注登録完了！\n報酬 ${jpy(commission)} が pending で記録されました。`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(message);
    } else {
      Alert.alert('完了', message);
    }
    router.back();
  }

  if (cLoading || pLoading) {
    return (
      <Screen>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>新規受注</Text>
      {detail && (
        <Text style={styles.sub}>
          {detail.name}
          {detail.branch_name ? ` ${detail.branch_name}` : ''}
        </Text>
      )}

      <Text style={styles.sectionLabel}>商品を選択</Text>
      <View style={{ gap: 8, marginBottom: 16 }}>
        {products.map((p) => {
          const selected = selectedProductId === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setSelectedProductId(p.id)}
              style={[styles.productRow, selected && styles.productRowSelected]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.productName, selected && { color: Brand.navy }]}>{p.name}</Text>
                <Text style={styles.productMeta}>
                  {p.maker_name} / {p.category ?? '-'}
                </Text>
              </View>
              <Text style={[styles.productPrice, selected && { color: Brand.navy, fontWeight: '800' }]}>{jpy(p.unit_price_jpy)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>数量</Text>
      <TextInput
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="例：100"
        placeholderTextColor={Ink[500]}
        style={styles.input}
      />

      <View style={styles.totalBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>小計</Text>
          <Text style={styles.totalValue}>{jpy(subtotal)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}>
          <Text style={styles.commissionLabel}>自分の報酬（2%）</Text>
          <Text style={styles.commissionValue}>{jpy(commission)}</Text>
        </View>
      </View>

      {error && <Text style={styles.error}>エラー: {error}</Text>}

      <Pressable
        onPress={submit}
        disabled={!product || quantityNum <= 0 || submitting}
        style={[styles.button, (!product || quantityNum <= 0 || submitting) && styles.buttonDisabled]}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>受注を登録</Text>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 13, color: Ink[700], marginTop: 4, marginBottom: 16 },

  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  sectionLabel: { fontSize: 12, color: Ink[500], letterSpacing: 1, marginBottom: 8, marginTop: 4 },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  productName: { fontSize: 14, fontWeight: '600', color: Ink[900] },
  productMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: '600', color: Ink[700] },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[100],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Ink[900],
    marginBottom: 16,
  },

  totalBox: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  totalValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  totalDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 10 },
  commissionLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  commissionValue: { color: Accent.emeraldLight, fontSize: 16, fontWeight: '700' },

  error: { color: Accent.red, fontSize: 12, marginBottom: 12 },

  button: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
});
