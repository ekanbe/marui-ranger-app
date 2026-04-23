import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useCustomerDetail } from '@/hooks/use-customer-detail';
import { supabase } from '@/lib/supabase';

const BUSINESS_TYPES = ['中華', 'カフェ', 'ドリンク', 'スイーツ', '和食', '居酒屋', 'その他'];

export default function CustomerEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading } = useCustomerDetail(id);

  const [name, setName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail) return;
    setName(detail.name);
    setBranchName(detail.branch_name ?? '');
    setAddress(detail.address ?? '');
    setBusinessType(detail.business_type ?? '');
  }, [detail]);

  async function submit() {
    if (!id || !name.trim()) return;
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase
      .from('customers')
      .update({
        name: name.trim(),
        branch_name: branchName.trim() || null,
        address: address.trim() || null,
        business_type: businessType || null,
      })
      .eq('id', id);

    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }

    const msg = `${name} を更新しました`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert('完了', msg);
    }
    router.back();
  }

  if (loading) {
    return (
      <Screen back>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    <Screen back>
      <Text style={styles.title}>顧客情報を編集</Text>
      <Text style={styles.sub}>{detail?.customer_code ?? '—'}</Text>

      <View style={styles.field}>
        <Text style={styles.label}>店舗名 <Text style={styles.required}>*</Text></Text>
        <TextInput value={name} onChangeText={setName} placeholderTextColor={Ink[400]} style={styles.input} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>支店名</Text>
        <TextInput value={branchName} onChangeText={setBranchName} placeholderTextColor={Ink[400]} style={styles.input} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>住所</Text>
        <TextInput value={address} onChangeText={setAddress} placeholderTextColor={Ink[400]} style={styles.input} />
      </View>

      <SectionTitle title="業種" />
      <View style={styles.chipRow}>
        {BUSINESS_TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setBusinessType(businessType === t ? '' : t)}
            style={[styles.chip, businessType === t && styles.chipActive]}
          >
            <Text style={[styles.chipText, businessType === t && styles.chipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

      <View style={{ marginTop: 20 }}>
        <Button
          label="保存"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!canSubmit}
          onPress={submit}
        />
      </View>

      <Text style={styles.note}>※ 悲鳴タグの編集は将来対応予定</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, marginBottom: 20, fontWeight: '700', letterSpacing: 0.5 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, color: Ink[700], fontWeight: '700', marginBottom: 8 },
  required: { color: '#EF4444', fontWeight: '900' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Ink[900],
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
  },
  chipActive: { backgroundColor: Brand.navy, borderColor: Brand.navy },
  chipText: { fontSize: 12, color: Ink[700], fontWeight: '700' },
  chipTextActive: { color: '#fff' },

  error: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 14,
    padding: 10,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderRadius: Radius.sm,
    textAlign: 'center',
  },

  note: { fontSize: 10, color: Ink[400], textAlign: 'center', marginTop: 14 },
});
