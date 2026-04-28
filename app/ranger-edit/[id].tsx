import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { rankLabel } from '@/constants/labels';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { useRangerDetail } from '@/hooks/use-ranger-detail';
import { supabase } from '@/lib/supabase';

const RANKS = ['bronze', 'silver', 'gold', 'platinum'] as const;

export default function RangerEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const isAdmin = profile?.role === 'admin';
  const { detail, loading } = useRangerDetail(id);

  const [displayName, setDisplayName] = useState('');
  const [rank, setRank] = useState<typeof RANKS[number]>('bronze');
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail) return;
    setDisplayName(detail.display_name);
    setRank((detail.current_rank as typeof RANKS[number]) ?? 'bronze');
    setGoal(String(detail.monthly_goal_jpy ?? 0));
  }, [detail]);

  async function save() {
    if (!id || !displayName.trim()) return;
    setSaving(true);
    setError(null);

    // profiles 更新
    const { error: pErr } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', id);
    if (pErr) {
      setSaving(false);
      setError(`profiles: ${pErr.message}`);
      return;
    }

    // rangers 更新（ランク＋目標）
    const goalNum = Math.max(0, Math.floor(Number(goal) || 0));
    const { error: rErr } = await supabase
      .from('rangers')
      .update({ current_rank: rank, monthly_goal_jpy: goalNum })
      .eq('id', id);

    setSaving(false);
    if (rErr) {
      setError(`rangers: ${rErr.message}`);
      return;
    }

    const msg = '✅ 更新しました';
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

  if (!isAdmin) {
    return (
      <Screen back>
        <Text style={styles.error}>管理者のみ利用可能です</Text>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen back>
        <Text style={styles.notFound}>レンジャーが見つかりません</Text>
      </Screen>
    );
  }

  const canSave = !saving && displayName.trim().length > 0;

  return (
    <Screen back>
      <Text style={styles.title}>レンジャー編集</Text>
      <Text style={styles.sub}>
        レンジャー{detail.ranger_number}号・{detail.ranger_code}
      </Text>

      <SectionTitle title="基本情報" style={{ marginTop: 20 }} />
      <View style={styles.field}>
        <Text style={styles.label}>表示名 <Text style={styles.req}>*</Text></Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <SectionTitle title="ランク" style={{ marginTop: 20 }} />
      <View style={styles.chipRow}>
        {RANKS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRank(r)}
            style={[styles.chip, rank === r && styles.chipActive]}
          >
            <Text style={[styles.chipText, rank === r && styles.chipTextActive]}>{rankLabel(r)}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle title="月間目標（円）" style={{ marginTop: 20 }} />
      <TextInput
        value={goal}
        onChangeText={setGoal}
        placeholder="500000"
        placeholderTextColor={Ink[400]}
        keyboardType="numeric"
        style={styles.input}
      />

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
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, fontWeight: '700', letterSpacing: 0.5 },

  field: { marginBottom: 14 },
  label: { fontSize: 12, color: Ink[700], fontWeight: '700', marginBottom: 8 },
  req: { color: '#EF4444', fontWeight: '900' },
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
  notFound: { paddingVertical: 48, textAlign: 'center', color: Ink[500] },
});
