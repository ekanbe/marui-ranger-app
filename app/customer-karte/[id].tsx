import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { AutoGrowTextInput } from '@/components/ui/AutoGrowTextInput';
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
  type DeliveryStyle,
  type ListingStatus,
  type OperationType,
  type OrderStyle,
  type PaymentMethod,
} from '@/hooks/use-customer-karte';

const OPERATION_OPTIONS: { value: OperationType; label: string }[] = [
  { value: 'direct', label: '直営中心' },
  { value: 'fc', label: 'FC中心' },
  { value: 'mixed', label: '直営+FC' },
];

const LISTING_OPTIONS: { value: ListingStatus; label: string }[] = [
  { value: 'listed', label: '上場' },
  { value: 'private', label: '非上場' },
  { value: 'unknown', label: '未確認' },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank', label: '銀行振込' },
  { value: 'tegata', label: '手形' },
  { value: 'densai', label: 'でんさい' },
  { value: 'other', label: 'その他' },
];

const ORDER_STYLE_OPTIONS: { value: OrderStyle; label: string }[] = [
  { value: 'hq', label: '本部一括' },
  { value: 'store', label: '店舗個別' },
  { value: 'center', label: 'センター経由' },
  { value: 'mixed', label: '混合' },
];

const DELIVERY_STYLE_OPTIONS: { value: DeliveryStyle; label: string }[] = [
  { value: 'own_center', label: '自社センター' },
  { value: 'shared_center', label: '共配センター' },
  { value: 'direct', label: '店舗直送' },
  { value: 'unknown', label: '未確認' },
];

const SEGMENT_OPTIONS: { value: CustomerSegment; label: string }[] = [
  { value: 'family', label: 'ファミリー' },
  { value: 'business', label: 'ビジネス' },
  { value: 'student', label: '若者・学生' },
  { value: 'senior', label: 'シニア' },
  { value: 'tourist', label: 'インバウンド' },
  { value: 'mixed', label: '幅広い' },
];

export default function CustomerKarteEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading: loadingDetail } = useCustomerDetail(id);
  const { karte, loading: loadingKarte } = useCustomerKarte(id);
  const { session } = useAuth();

  // 企業概要
  const [storeCount, setStoreCount] = useState('');
  const [operationType, setOperationType] = useState<OperationType | null>(null);
  const [areaNote, setAreaNote] = useState('');
  const [revenueNote, setRevenueNote] = useState('');
  const [listing, setListing] = useState<ListingStatus | null>(null);
  // 取引条件
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [creditScore, setCreditScore] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  // 商流・意思決定
  const [orderStyle, setOrderStyle] = useState<OrderStyle | null>(null);
  const [deliveryStyle, setDeliveryStyle] = useState<DeliveryStyle | null>(null);
  const [decisionMaker, setDecisionMaker] = useState('');
  const [competitor, setCompetitor] = useState('');
  // 商品・提案
  const [signatureDish, setSignatureDish] = useState('');
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [needsNote, setNeedsNote] = useState('');
  // メモ
  const [freeNote, setFreeNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!karte) return;
    setStoreCount(karte.store_count != null ? String(karte.store_count) : '');
    setOperationType(karte.operation_type);
    setAreaNote(karte.area_note ?? '');
    setRevenueNote(karte.annual_revenue_note ?? '');
    setListing(karte.listing_status);
    setPaymentTerms(karte.payment_terms ?? '');
    setPaymentMethod(karte.payment_method);
    setCreditScore(karte.credit_score != null ? String(karte.credit_score) : '');
    setCreditLimit(karte.credit_limit_yen != null ? String(karte.credit_limit_yen) : '');
    setOrderStyle(karte.order_style);
    setDeliveryStyle(karte.delivery_style);
    setDecisionMaker(karte.decision_maker ?? '');
    setCompetitor(karte.competitor_supplier ?? '');
    setSignatureDish(karte.signature_dish ?? '');
    setSegments(Array.isArray(karte.target_segments) ? karte.target_segments : []);
    setNeedsNote(karte.needs_note ?? '');
    setFreeNote(karte.free_note ?? '');
  }, [karte]);

  function parseIntOrNull(s: string): number | null {
    const t = s.replace(/[,\s]/g, '');
    if (!t) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
  }

  function toggleSegment(v: CustomerSegment) {
    setSegments((prev) => (prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]));
  }

  async function submit() {
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await saveCustomerKarte(
        {
          customer_id: id,
          store_count: parseIntOrNull(storeCount),
          operation_type: operationType,
          area_note: areaNote.trim() || null,
          annual_revenue_note: revenueNote.trim() || null,
          listing_status: listing,
          payment_terms: paymentTerms.trim() || null,
          payment_method: paymentMethod,
          credit_score: parseIntOrNull(creditScore),
          credit_limit_yen: parseIntOrNull(creditLimit),
          order_style: orderStyle,
          delivery_style: deliveryStyle,
          decision_maker: decisionMaker.trim() || null,
          competitor_supplier: competitor.trim() || null,
          signature_dish: signatureDish.trim() || null,
          target_segments: segments,
          needs_note: needsNote.trim() || null,
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

  function ChipRow<T extends string>({
    options,
    selected,
    onSelect,
  }: {
    options: { value: T; label: string }[];
    selected: T | null;
    onSelect: (v: T | null) => void;
  }) {
    return (
      <View style={styles.chipRow}>
        {options.map((o) => {
          const active = selected === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onSelect(active ? null : o.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <Screen back>
      <Text style={styles.title}>顧客カルテを編集</Text>
      <Text style={styles.sub}>{detail?.name ?? '—'}</Text>
      <Text style={styles.lead}>
        企業概要・取引条件・商流を記録すると、担当交代や提案時にすぐ状況を把握できます
      </Text>

      {/* ── 企業概要 ── */}
      <SectionTitle title="企業概要" />

      <View style={styles.field}>
        <Text style={styles.label}>店舗数（店）</Text>
        <TextInput
          value={storeCount}
          onChangeText={setStoreCount}
          keyboardType="numeric"
          placeholder="例: 120"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>展開形態</Text>
        <ChipRow options={OPERATION_OPTIONS} selected={operationType} onSelect={setOperationType} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>展開エリア</Text>
        <TextInput
          value={areaNote}
          onChangeText={setAreaNote}
          placeholder="例: 全国 / 関東中心 / 首都圏+関西"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>年商規模</Text>
        <TextInput
          value={revenueNote}
          onChangeText={setRevenueNote}
          placeholder="例: 約300億円 / 非公開"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>上場区分</Text>
        <ChipRow options={LISTING_OPTIONS} selected={listing} onSelect={setListing} />
      </View>

      {/* ── 取引条件（与信・支払い） ── */}
      <SectionTitle title="取引条件（与信・支払い）" />

      <View style={styles.field}>
        <Text style={styles.label}>締め・支払い条件</Text>
        <TextInput
          value={paymentTerms}
          onChangeText={setPaymentTerms}
          placeholder="例: 月末締め 翌月末払い"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>支払方法</Text>
        <ChipRow options={PAYMENT_METHOD_OPTIONS} selected={paymentMethod} onSelect={setPaymentMethod} />
      </View>

      <View style={styles.row2}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>与信スコア（0〜100）</Text>
          <TextInput
            value={creditScore}
            onChangeText={setCreditScore}
            keyboardType="numeric"
            placeholder="例: 80"
            placeholderTextColor={Ink[400]}
            style={styles.input}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>与信限度額（円）</Text>
          <TextInput
            value={creditLimit}
            onChangeText={setCreditLimit}
            keyboardType="numeric"
            placeholder="例: 5000000"
            placeholderTextColor={Ink[400]}
            style={styles.input}
          />
        </View>
      </View>

      {/* ── 商流・意思決定 ── */}
      <SectionTitle title="商流・意思決定" />

      <View style={styles.field}>
        <Text style={styles.label}>発注形態</Text>
        <ChipRow options={ORDER_STYLE_OPTIONS} selected={orderStyle} onSelect={setOrderStyle} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>物流形態</Text>
        <ChipRow options={DELIVERY_STYLE_OPTIONS} selected={deliveryStyle} onSelect={setDeliveryStyle} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>キーマン・決裁者</Text>
        <TextInput
          value={decisionMaker}
          onChangeText={setDecisionMaker}
          placeholder="例: 商品部 田中部長"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>競合仕入先</Text>
        <TextInput
          value={competitor}
          onChangeText={setCompetitor}
          placeholder="例: ○○フーズから冷凍を仕入れ"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      {/* ── 商品・提案 ── */}
      <SectionTitle title="商品・提案" />

      <View style={styles.field}>
        <Text style={styles.label}>看板商品・主力メニュー</Text>
        <TextInput
          value={signatureDish}
          onChangeText={setSignatureDish}
          placeholder="例: 唐揚げ定食 / タピオカドリンク"
          placeholderTextColor={Ink[400]}
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>ターゲット客層（複数選択可）</Text>
        <View style={styles.chipRow}>
          {SEGMENT_OPTIONS.map((o) => {
            const active = segments.includes(o.value);
            return (
              <Pressable
                key={o.value}
                onPress={() => toggleSegment(o.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>提案ニーズ・課題</Text>
        <AutoGrowTextInput
          value={needsNote}
          onChangeText={setNeedsNote}
          placeholder="例: ドリンク原価を下げたい / 通年商品を探している"
          placeholderTextColor={Ink[400]}
          style={styles.input}
          minHeight={44}
        />
      </View>

      {/* ── メモ ── */}
      <SectionTitle title="メモ" />
      <View style={styles.field}>
        <AutoGrowTextInput
          value={freeNote}
          onChangeText={setFreeNote}
          placeholder="その他、提案・交渉に役立つ情報"
          placeholderTextColor={Ink[400]}
          style={styles.input}
          minHeight={44}
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
  row2: { flexDirection: 'row', gap: 10 },
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
