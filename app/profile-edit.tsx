import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { roleLabel } from '@/constants/labels';
import { Appetite, Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/lib/supabase';

export default function ProfileEditScreen() {
  const { session } = useAuth();
  const { profile, loading, reload } = useProfile(session);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

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
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: false,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      await uploadImage(asset.uri, asset.mimeType);
    } catch (e: any) {
      setError(e?.message ?? '画像の選択に失敗しました');
    }
  }

  async function takePhoto() {
    try {
      setError(null);
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('カメラへのアクセスが拒否されました');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      await uploadImage(asset.uri, asset.mimeType);
    } catch (e: any) {
      setError(e?.message ?? 'カメラ起動に失敗しました');
    }
  }

  async function uploadImage(uri: string, mimeType?: string) {
    if (!session) return;
    setUploading(true);
    setError(null);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const ext = mimeType?.includes('png') ? 'png' : 'jpg';
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, {
          contentType: mimeType ?? 'image/jpeg',
          upsert: true,
        });

      if (upErr) throw upErr;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      setAvatarUrl(publicUrl);
    } catch (e: any) {
      setError(e?.message ?? 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    setAvatarUrl(null);
  }

  async function save() {
    if (!session || !displayName.trim()) return;
    setSaving(true);
    setError(null);

    const cleanUrl = avatarUrl ? avatarUrl.split('?')[0] : null;

    const { error: err } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        avatar_url: cleanUrl,
      })
      .eq('id', session.user.id);

    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }

    await reload();

    const msg = '✅ プロフィールを更新しました';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(msg);
    } else {
      Alert.alert('完了', msg);
    }
    router.back();
  }

  if (loading || !profile) {
    return (
      <Screen>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  const canSave = displayName.trim().length > 0 && !saving && !uploading;

  return (
    <Screen>
      <Text style={styles.title}>プロフィール編集</Text>
      <Text style={styles.sub}>あなたの情報を更新できます</Text>

      {/* アバター編集エリア */}
      <Card variant="elevated" padding={24} style={{ marginBottom: 20, alignItems: 'center' }}>
        <View style={styles.avatarWrap}>
          <Avatar name={displayName} imageUrl={avatarUrl} size="xl" />
          {uploading ? (
            <View style={styles.uploadingOverlay}>
              <Text style={styles.uploadingText}>アップロード中...</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.avatarActions}>
          <Button
            label="📷 カメラで撮影"
            variant="secondary"
            size="sm"
            onPress={takePhoto}
            disabled={uploading}
          />
          <Button
            label="🖼️ ライブラリから選択"
            variant="primary"
            size="sm"
            onPress={pickImage}
            disabled={uploading}
          />
        </View>

        {avatarUrl ? (
          <Pressable onPress={removeAvatar} style={{ marginTop: 12 }}>
            <Text style={styles.removeText}>写真を削除</Text>
          </Pressable>
        ) : null}
      </Card>

      {/* 名前編集 */}
      <SectionTitle title="表示名" />
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="例：神戸 慧士"
        placeholderTextColor={Ink[400]}
        style={styles.input}
      />

      {/* 情報（変更不可） */}
      <SectionTitle title="アカウント情報" caption="変更不可" style={{ marginTop: 20 }} />
      <Card variant="muted" padding={16}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>メール</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{profile.email ?? '—'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>ロール</Text>
          <Badge
            label={roleLabel(profile.role)}
            tone={profile.role === 'admin' ? 'violet' : 'navy'}
          />
        </View>
      </Card>

      {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

      <View style={{ marginTop: 24 }}>
        <Button
          label="保存"
          variant="primary"
          size="lg"
          fullWidth
          loading={saving}
          disabled={!canSave}
          onPress={save}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, marginBottom: 20 },

  avatarWrap: { position: 'relative', marginBottom: 16 },
  uploadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  avatarActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  removeText: { color: Appetite.ember, fontSize: 12, fontWeight: '700' },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Ink[900],
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoLabel: { fontSize: 12, color: Ink[500], fontWeight: '700' },
  infoValue: { fontSize: 13, color: Ink[900], fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  divider: { height: 1, backgroundColor: Ink[200], marginVertical: 8 },

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

void Brand;
