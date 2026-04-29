import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Button } from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useCustomerDetail } from '@/hooks/use-customer-detail';
import {
  saveCustomerKarte,
  useCustomerKarte,
  type CustomerSegment,
  type FreezerCapacity,
  type KitchenSize,
} from '@/hooks/use-customer-karte';

type Tri = 'yes' | 'no' | 'unknown';

const TRI_OPTIONS: { value: Tri; label: string }[] = [
  { value: 'yes', label: 'あり' },
  { value: 'no', label: 'なし' },
  { value: 'unknown', label: '未確認' },
];

const SIZE_OPTIONS: { value: 'small' | 'medium' | 'large'; label: string }[] = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' },
];

const SEGMENT_OPTIONS: { value: CustomerSegment; label: string }[] = [
  { value: 'family', label: 'ファミリー' },
  { value: 'business', label: 'ビジネス' },
  { value: 'tourist', label: '観光客' },
  { value: 'student', label: '学生' },
  { value: 'senior', label: 'シニア' },
  { value: 'mixed', label: '混合' },
];

function boolToTri(v: boolean | null): Tri {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  return 'unknown';
}
function triToBool(t: Tri): boolean | null {
  if (t === 'yes') return true;
  if (t === 'no') return false;
  return null;
}

export default function CustomerKarteEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading: loadingDetail } = useCustomerDetail(id);
  const { karte, loading: loadingKarte } = useCustomerKarte(id);
  const { session } = useAuth();

  // 厨房
  const [hasFryer, setHasFryer] = useState<Tri>('unknown');
  const [hasOven, setHasOven] = useState<Tri>('unknown');
  const [freezer, setFreezer] = useState<FreezerCapacity | null>(null);
  const [kitchenSize, setKitchenSize] = useState<KitchenSize | null>(null);
  // オペ
  const [staffCount, setStaffCount] = useState('');
  const [peakHours, setPeakHours] = useState('');
  const [avgServeMin, setAvgServeMin] = useState('');
  // メニュー
  const [avgCheckYen, setAvgCheckYen] = useState('');
  const [signatureDish, setSignatureDish] = useState('');
  const [seasonalNote, setSeasonalNote] = useState('');
  // 客層
  const [segment, setSegment] = useState<CustomerSegment | null>(null);
  const [repeatRateNote, setRepeatRateNote] = useState('');
  // 自由
  const [freeNote, setFreeNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!karte) return;
    setHasFryer(boolToTri(karte.has_fryer));
    setHasOven(boolToTri(karte.has_convection_oven));
    setFreezer(karte.freezer_capacity);
    setKitchenSize(karte.kitchen_size);
    setStaffCount(karte.staff_count != null ? String(karte.staff_count) : '');
    setPeakHours(karte.peak_hours ?? '');
    setAvgServeMin(karte.avg_serve_minutes != null ? String(karte.avg_serve_minutes) : '');
    setAvgCheckYen(karte.avg_check_yen != null ? String(karte.avg_check_yen) : '');
    setSignatureDish(karte.signature_dish ?? '');
    setSeasonalNote(karte.seasonal_menu_note ?? '');
    setSegment(karte.customer_segment);
    setRepeatRateNote(karte.repeat_rate_note ?? '');
    setFreeNote(karte.free_note ?? '');
  }, [karte]);

  function parseIntOrNull(s: string): number | null {
    const t = s.trim();
    if (!t) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
  }

  async function submit() {
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveCustomerKarte(
        {
          customer_id: id,
          has_fryer: triToBool(hasFryer),
          has_convection_oven: triToBool(hasOven),
          freezer_capacity: freezer,
          kitchen_size: kitchenSize,
          staff_count: parseIntOrNull(staffCount),
          peak_hours: peakHours.trim() || null,
          avg_serve_minutes: parseIntOrNull(avgServeMin),
          avg_check_yen: parseIntOrNull(avgCheckYen),
          signature_dish: signatureDish.trim() || null,
          seasonal_menu_note: seasonalNote.trim() || null,
          customer_segment: segment,
          repeat_rate_note: repeatRateNote.trim() || null,
          free_note: freeNote.trim() || null,
        },
        session?.user.id ?? null,
      );
      const msg = 'カルテを保存しました';
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

  if (loadingDetail || loadingKarte) {
    return (
      <Screen back>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  return (
    <Screen back>
      <Text style={styles.title}>顧客カルテを編集</Text>
      <Text style={styles.sub}>{detail?.name ?? '—'}</Text>
      <Text style={styles.lead}>
        厨房環境・オペ・客層を記録すると、提案候補がより正確になります
      </Text>

      {/* 厨房環境 */}
      <SectionTitle title="厨房環境" />

      <View style={styles.field}>
        <Text style={styles.label}>フライヤー</Text>
        <View style={styles.chipRow}>
          {TRI_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => setHasFryer(o.value)}
              style={[styles.chip, hasFryer === o.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, hasFryer === o.value && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>コンベクションオーブン</Text>
        <View style={styles.chipRow}>
          {TRI_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => setHasOven(o.value)}
              style={[styles.chip, hasOven === o.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, hasOven === o.value && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>冷凍庫容量</Text>
        <View style={styles.chipRow}>
          {SIZE_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => setFreezer(freezer === o.value ? null : (o.value as FreezerCapacity))}
              style={[styles.chip, freezer === o.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, freezer === o.value && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>厨房サイズ</Text>
        <View style={styles.chipRow}>
          {SIZE_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => setKitchenSize(kitchenSize === o.value ? null : (o.value as KitchenSize))}
              style={[styles.chip, kitchenSize === o.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, kitchenSize === o.value && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* オペレーション */}
      <SectionTitle title="オペレーション" />

      <View style={styles.field}>
        <Text style={styles.label}>スタッフ数（人）</Text>
        <TextInput
          value={staffCount}
          onChangeText={setStaffCount}
          keyboardType="numeric"
          placeholder="例: 5"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>ピーク時間帯</Text>
        <TextInput
          value={peakHours}
          onChangeText={setPeakHours}
          placeholder="例: 11:30-13:30, 18:00-20:00"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>平均提供時間（分）</Text>
        <TextInput
          value={avgServeMin}
          onChangeText={setAvgServeMin}
          keyboardType="numeric"
          placeholder="例: 10"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      {/* メニュー構成 */}
      <SectionTitle title="メニュー構成" />

      <View style={styles.field}>
        <Text style={styles.label}>客単価（円）</Text>
        <TextInput
          value={avgCheckYen}
          onChangeText={setAvgCheckYen}
          keyboardType="numeric"
          placeholder="例: 1500"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>看板商品</Text>
        <TextInput
          value={signatureDish}
          onChangeText={setSignatureDish}
          placeholder="例: 小籠包セット"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>季節メニューメモ</Text>
        <TextInput
          value={seasonalNote}
          onChangeText={setSeasonalNote}
          placeholder="季節限定メニューや入れ替えタイミングなど"
          placeholderTextColor={Ink[400]}
          style={[styles.input, styles.multiline]}
          multiline
        />
      </View>

      {/* 顧客層 */}
      <SectionTitle title="顧客層" />

      <View style={styles.field}>
        <Text style={styles.label}>セグメント</Text>
        <View style={styles.chipRow}>
          {SEGMENT_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => setSegment(segment === o.value ? null : o.value)}
              style={[styles.chip, segment === o.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, segment === o.value && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>リピート率メモ</Text>
        <TextInput
          value={repeatRateNote}
          onChangeText={setRepeatRateNote}
          placeholder="例: 常連7割、観光客3割"
          placeholderTextColor={Ink[400]}
          style={[styles.input, styles.multiline]}
          multiline
        />
      </View>

      {/* 自由記述 */}
      <SectionTitle title="自由記述" />
      <View style={styles.field}>
        <TextInput
          value={freeNote}
          onChangeText={setFreeNote}
          placeholder="その他、提案に役立ちそうな情報"
          placeholderTextColor={Ink[400]}
          style={[styles.input, styles.multilineLarge]}
          multiline
        />
      </View>

      {error ? <Text style={styles.error}>エラー: {error}</Text> : null}

      <View style={{ marginTop: 20 }}>
        <Button
          label="カルテを保存"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={submitting}
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
  multilineLarge: { minHeight: 110, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
});
