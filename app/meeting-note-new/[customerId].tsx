import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { AutoGrowTextInput } from '@/components/ui/AutoGrowTextInput';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCustomerDetail } from '@/hooks/use-customer-detail';
import { addMeetingNote } from '@/hooks/use-meeting-notes';
import { supabase } from '@/lib/supabase';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MeetingNoteNewScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { detail } = useCustomerDetail(customerId);
  const { session } = useAuth();

  const [metAt, setMetAt] = useState(todayISO());
  const [title, setTitle] = useState('');
  const [attendees, setAttendees] = useState('');
  const [body, setBody] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickImages() {
    if (!customerId) return;
    try {
      setError(null);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('写真ライブラリへのアクセスが拒否されました');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 6,
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const uploaded: string[] = [];
      for (const asset of result.assets) {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const ext = (asset.mimeType ?? blob.type).includes('png') ? 'png' : 'jpg';
        const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
        const path = `${customerId}/note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('meeting-note-images')
          .upload(path, blob, { contentType, upsert: true });
        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('meeting-note-images').getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch (e: any) {
      setError(e?.message ?? '写真のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImageUrls((prev) => prev.filter((u) => u !== url));
  }

  const bodyEmpty = body.trim().length === 0;
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(metAt.trim());

  async function submit() {
    if (!customerId) return;
    if (bodyEmpty) {
      setError('議事録の本文を入力してください');
      return;
    }
    if (!dateValid) {
      setError('日付は YYYY-MM-DD 形式で入力してください');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await addMeetingNote(
        {
          customer_id: customerId,
          met_at: metAt.trim(),
          title: title.trim() || null,
          attendees: attendees.trim() || null,
          body: body.trim(),
          next_action: nextAction.trim() || null,
          image_urls: imageUrls,
        },
        session?.user.id ?? null,
      );
      const msg = '議事録を保存しました';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.alert(msg);
      } else {
        Alert.alert('完了', msg);
      }
      router.back();
    } catch (e: any) {
      setError(e?.message ?? '保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen back>
      <Text style={styles.title}>議事録を追加</Text>
      <Text style={styles.sub}>{detail?.name ?? '—'}</Text>
      <Text style={styles.lead}>
        商談・訪問・MTGの記録を残すと、カルテと合わせて顧客の状況を時系列で追えます
      </Text>

      <SectionTitle title="基本情報" />

      <View style={styles.field}>
        <Text style={styles.label}>日付</Text>
        <TextInput
          value={metAt}
          onChangeText={setMetAt}
          placeholder="2026-07-09"
          placeholderTextColor={Ink[400]}
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>件名（任意）</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="例: 新商品ドリンクの提案・価格交渉"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>参加者（任意）</Text>
        <TextInput
          value={attendees}
          onChangeText={setAttendees}
          placeholder="例: 先方 商品部 田中様 / 当社 松永"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <SectionTitle title="議事録" />

      <View style={styles.field}>
        <Text style={styles.label}>本文</Text>
        <AutoGrowTextInput
          value={body}
          onChangeText={setBody}
          placeholder="話した内容・決まったこと・先方の反応など"
          placeholderTextColor={Ink[400]}
          style={styles.input}
          minHeight={150}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>次アクション（任意）</Text>
        <AutoGrowTextInput
          value={nextAction}
          onChangeText={setNextAction}
          placeholder="例: 来週サンプル持参・見積提出"
          placeholderTextColor={Ink[400]}
          style={styles.input}
          minHeight={70}
        />
      </View>

      {/* 写真添付 */}
      <SectionTitle title="写真" caption="メニュー・一括表示・店舗外観など(6枚まで)" />
      {imageUrls.length > 0 ? (
        <View style={styles.photoGrid}>
          {imageUrls.map((url) => (
            <View key={url} style={styles.photoWrap}>
              <Image source={{ uri: url }} style={styles.photo} contentFit="cover" />
              <Pressable onPress={() => removeImage(url)} style={styles.photoRemove} hitSlop={6}>
                <Text style={styles.photoRemoveText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.field}>
        <Button
          label={uploading ? 'アップロード中...' : '📷 写真を追加'}
          variant="secondary"
          size="md"
          fullWidth
          onPress={pickImages}
          disabled={uploading || imageUrls.length >= 6}
          loading={uploading}
        />
      </View>

      {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

      <View style={{ marginTop: 20 }}>
        <Button
          label="議事録を保存"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={submitting || bodyEmpty}
          onPress={submit}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 14, color: Ink[700], marginTop: 4, fontWeight: '700' },
  lead: { fontSize: 11, color: Ink[500], marginTop: 6, marginBottom: 18, lineHeight: 16 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, color: Ink[700], fontWeight: '700', marginBottom: 8 },
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
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  multilineLarge: { minHeight: 150, textAlignVertical: 'top' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  photoWrap: { position: 'relative' },
  photo: { width: 92, height: 92, borderRadius: Radius.sm, backgroundColor: Ink[100] },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Ink[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: { color: '#fff', fontSize: 11, fontWeight: '800' },

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
