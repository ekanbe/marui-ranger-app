import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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
  const [vipsCode, setVipsCode] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail) return;
    setName(detail.name);
    setBranchName(detail.branch_name ?? '');
    setAddress(detail.address ?? '');
    setBusinessType(detail.business_type ?? '');
    setVipsCode(detail.customer_code ?? '');
    setImageUrl(detail.image_url);
  }, [detail]);

  async function pickImage() {
    try {
      setError(null);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('写真ライブラリへのアクセスが拒否されました');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: Platform.OS !== 'web',
        aspect: [16, 9],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      await uploadFromUri(asset.uri, asset.mimeType);
    } catch (e: any) {
      setError(e?.message ?? '画像選択に失敗しました');
    }
  }

  async function uploadFromUri(uri: string, mimeType?: string) {
    if (!id) return;
    setUploading(true);
    setError(null);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = (mimeType ?? blob.type).includes('png') ? 'png' : 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const path = `${id}/store-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('customer-images')
        .upload(path, blob, { contentType, upsert: true });
      if (upErr) throw upErr;

      const { data: publicData } = supabase.storage.from('customer-images').getPublicUrl(path);
      setImageUrl(`${publicData.publicUrl}?t=${Date.now()}`);
    } catch (e: any) {
      setError(e?.message ?? 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!id || !name.trim()) return;
    setSubmitting(true);
    setError(null);

    const cleanUrl = imageUrl ? imageUrl.split('?')[0] : null;

    const { error: err } = await supabase
      .from('customers')
      .update({
        name: name.trim(),
        branch_name: branchName.trim() || null,
        address: address.trim() || null,
        business_type: businessType || null,
        image_url: cleanUrl,
        // VIPS店舗コードは新規開拓顧客のみ編集可（既存顧客はVIPS取込みのキーなので触らない）
        ...(detail?.acquired_by_ranger_id ? { customer_code: vipsCode.trim() || null } : {}),
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

  const canSubmit = name.trim().length > 0 && !submitting && !uploading;

  return (
    <Screen back>
      <Text style={styles.title}>顧客情報を編集</Text>
      <Text style={styles.sub}>{detail?.customer_code ?? '—'}</Text>

      {/* 店舗画像エリア */}
      <SectionTitle title="店舗画像" caption="タップして変更" />
      <Pressable onPress={pickImage} style={styles.imageBox} disabled={uploading}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 32 }}>🏪</Text>
            <Text style={styles.imagePlaceholderText}>+ 画像を追加</Text>
          </View>
        )}
        {uploading ? (
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>アップロード中...</Text>
          </View>
        ) : null}
      </Pressable>
      {imageUrl ? (
        <Pressable onPress={() => setImageUrl(null)} style={{ alignSelf: 'flex-start', marginBottom: 14 }}>
          <Text style={styles.removeText}>画像を削除</Text>
        </Pressable>
      ) : null}

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

      {/* VIPS店舗コード（新規開拓顧客のみ） */}
      {detail?.acquired_by_ranger_id ? (
        <View style={styles.field}>
          <Text style={styles.label}>VIPS店舗コード</Text>
          <TextInput
            value={vipsCode}
            onChangeText={setVipsCode}
            placeholder="成約してVIPSに登録されたら入力"
            placeholderTextColor={Ink[400]}
            style={styles.input}
            autoCapitalize="characters"
          />
          <Text style={styles.hint}>
            💡 コードを入力すると、VIPSの売上取込みでこの顧客に売上が自動で紐づきます（初回発注でフェーズも「発注」へ自動更新）
          </Text>
        </View>
      ) : null}

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

  imageBox: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: Ink[100],
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    backgroundColor: 'rgba(30,58,95,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Ink[200],
    borderStyle: 'dashed',
  },
  imagePlaceholderText: { fontSize: 12, color: Ink[500], fontWeight: '700' },
  imageOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  removeText: { color: '#DC2626', fontSize: 12, fontWeight: '700', marginBottom: 14 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, color: Ink[700], fontWeight: '700', marginBottom: 8 },
  hint: { fontSize: 10, color: Ink[500], marginTop: 6, lineHeight: 15 },
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
