import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { AvatarCropper } from '@/components/ui/AvatarCropper';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { roleLabel } from '@/constants/labels';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useMyRanger } from '@/hooks/use-my-ranger';
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/lib/supabase';

const isWeb = Platform.OS === 'web';

export default function ProfileEditScreen() {
  const { session } = useAuth();
  const { profile, loading, reload } = useProfile(session);
  const { ranger: myRanger } = useMyRanger(session);
  const isRanger = profile?.role === 'ranger';

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web用: クロップ前の画像source
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    if (myRanger) {
      setMonthlyGoal(String(myRanger.monthly_goal_jpy ?? 0));
    }
  }, [myRanger]);

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
        allowsEditing: !isWeb, // Web では自前クロッパーを使う
        aspect: [1, 1],
        quality: 0.92,
        base64: false,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      if (isWeb) {
        setCropSrc(asset.uri);
      } else {
        await uploadFromUri(asset.uri, asset.mimeType);
      }
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
        allowsEditing: !isWeb,
        aspect: [1, 1],
        quality: 0.92,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];

      if (isWeb) {
        setCropSrc(asset.uri);
      } else {
        await uploadFromUri(asset.uri, asset.mimeType);
      }
    } catch (e: any) {
      setError(e?.message ?? 'カメラ起動に失敗しました');
    }
  }

  async function uploadFromUri(uri: string, mimeType?: string) {
    if (!session) return;
    setUploading(true);
    setError(null);

    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBlob(blob, mimeType);
    } catch (e: any) {
      setError(e?.message ?? 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  }

  async function uploadBlob(blob: Blob, mimeType?: string) {
    if (!session) return;
    setUploading(true);
    setError(null);

    try {
      const ext = (mimeType ?? blob.type).includes('png') ? 'png' : 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType, upsert: true });

      if (upErr) throw upErr;

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

      setAvatarUrl(publicUrl);
    } catch (e: any) {
      setError(e?.message ?? 'アップロードに失敗しました');
      throw e;
    } finally {
      setUploading(false);
    }
  }

  async function handleCropConfirm(blob: Blob) {
    try {
      await uploadBlob(blob, 'image/jpeg');
      setCropSrc(null);
    } catch {
      // error は uploadBlob 内で set 済み
    }
  }

  function removeAvatar() {
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

    if (err) {
      setSaving(false);
      setError(err.message);
      return;
    }

    // レンジャーなら月間目標も更新
    if (isRanger) {
      const goalNum = Math.max(0, Math.floor(Number(monthlyGoal) || 0));
      const { error: rErr } = await supabase
        .from('rangers')
        .update({ monthly_goal_jpy: goalNum })
        .eq('id', session.user.id);
      if (rErr) {
        setSaving(false);
        setError(rErr.message);
        return;
      }
    }

    setSaving(false);
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
      <Screen back>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  // Web: クロップ中
  if (isWeb && cropSrc) {
    return (
      <Screen back>
        <Text style={styles.title}>プロフィール写真</Text>
        <Text style={styles.sub}>アイコンに表示する範囲を選んでください</Text>
        <View style={{ marginTop: 16 }}>
          <AvatarCropper
            imageSrc={cropSrc}
            onCancel={() => setCropSrc(null)}
            onConfirm={handleCropConfirm}
            submitting={uploading}
          />
        </View>
        {error ? <Text style={styles.error}>エラー: {error}</Text> : null}
      </Screen>
    );
  }

  const canSave = displayName.trim().length > 0 && !saving && !uploading;

  return (
    <Screen back>
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

        <Text style={styles.hint}>
          {isWeb
            ? '選択後、範囲を調整する画面が開きます'
            : '画像選択時にネイティブのトリミング画面が開きます'}
        </Text>
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

      {/* 月間目標（レンジャーのみ） */}
      {isRanger ? (
        <>
          <SectionTitle title="月間目標" caption="達成したい売上金額（円）" style={{ marginTop: 20 }} />
          <TextInput
            value={monthlyGoal}
            onChangeText={setMonthlyGoal}
            placeholder="500000"
            placeholderTextColor={Ink[400]}
            keyboardType="numeric"
            style={styles.input}
          />
        </>
      ) : null}

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
            label={
              isRanger && myRanger?.ranger_number
                ? `レンジャー${myRanger.ranger_number}号`
                : roleLabel(profile.role)
            }
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
  removeText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  hint: { fontSize: 10, color: Ink[400], marginTop: 12, textAlign: 'center' },

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
