import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
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
      <Screen>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      </Screen>
    );
  }

  const canSubmit = name.trim().length > 0 && !submitting;

  return (
    <Screen>
      <Text style={styles.title}>顧客情報を編集</Text>
      <Text style={styles.sub}>{detail?.customer_code ?? '-'}</Text>

      <Text style={styles.label}>店舗名 *</Text>
      <TextInput value={name} onChangeText={setName} placeholderTextColor={Ink[500]} style={styles.input} />

      <Text style={styles.label}>支店名</Text>
      <TextInput
        value={branchName}
        onChangeText={setBranchName}
        placeholderTextColor={Ink[500]}
        style={styles.input}
      />

      <Text style={styles.label}>住所</Text>
      <TextInput value={address} onChangeText={setAddress} placeholderTextColor={Ink[500]} style={styles.input} />

      <Text style={styles.label}>業種</Text>
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

      {error && <Text style={styles.error}>エラー: {error}</Text>}

      <Pressable onPress={submit} disabled={!canSubmit} style={[styles.button, !canSubmit && styles.buttonDisabled]}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>保存</Text>}
      </Pressable>

      <Text style={styles.note}>※ 悲鳴タグの編集は顧客詳細画面で今後対応予定</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingBox: { paddingVertical: 48, alignItems: 'center' },

  title: { fontSize: 22, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, marginBottom: 20 },

  label: { fontSize: 12, color: Ink[700], fontWeight: '600', marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[100],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Ink[900],
    marginBottom: 8,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[100],
  },
  chipActive: { backgroundColor: Brand.navy, borderColor: Brand.navy },
  chipText: { fontSize: 12, color: Ink[700], fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  error: { color: Accent.red, fontSize: 12, marginTop: 8, marginBottom: 8 },

  button: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },

  note: { fontSize: 10, color: Ink[500], textAlign: 'center', marginTop: 16 },
});
