import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ShowroomInviteModal } from '@/components/showroom/ShowroomInviteModal';
import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { deriveStatus, type DerivedStatus } from '@/hooks/use-customers';
import { useCustomerDetail } from '@/hooks/use-customer-detail';
import { useCustomerKarte } from '@/hooks/use-customer-karte';
import { useCustomerOrders } from '@/hooks/use-customer-orders';
import { daysSince, jpy, shortDate } from '@/lib/format';
import { SALES_PHASES, type SalesPhase, getPhaseLabel, getPhaseTone } from '@/lib/sales-phase';
import { supabase } from '@/lib/supabase';

const STATUS_LABEL: Record<DerivedStatus, string> = { good: '好調', stall: '停滞', follow: '要フォロー' };
const STATUS_TONE: Record<DerivedStatus, 'emerald' | 'amber' | 'red'> = {
  good: 'emerald',
  stall: 'amber',
  follow: 'red',
};

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'cancelled';
const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '未確定',
  confirmed: '確定',
  shipped: '出荷済',
  cancelled: '中止',
};
const ORDER_STATUS_TONE: Record<OrderStatus, 'amber' | 'emerald' | 'navy' | 'neutral'> = {
  pending: 'amber',
  confirmed: 'emerald',
  shipped: 'navy',
  cancelled: 'neutral',
};

const SEGMENT_LABEL: Record<string, string> = {
  family: 'ファミリー',
  business: 'ビジネス',
  student: '若者・学生',
  senior: 'シニア',
  tourist: 'インバウンド',
  mixed: '幅広い',
};
const OPERATION_LABEL: Record<string, string> = { direct: '直営中心', fc: 'FC中心', mixed: '直営+FC' };
const LISTING_LABEL: Record<string, string> = { listed: '上場', private: '非上場', unknown: '未確認' };
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bank: '銀行振込',
  tegata: '手形',
  densai: 'でんさい',
  other: 'その他',
};
const ORDER_STYLE_LABEL: Record<string, string> = {
  hq: '本部一括',
  store: '店舗個別',
  center: 'センター経由',
  mixed: '混合',
};
const DELIVERY_STYLE_LABEL: Record<string, string> = {
  own_center: '自社センター',
  shared_center: '共配センター',
  direct: '店舗直送',
  unknown: '未確認',
};

function KarteItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.karteItem}>
      <Text style={styles.karteItemLabel}>{label}</Text>
      <Text style={styles.karteItemValue}>{value}</Text>
    </View>
  );
}

function KarteLine({ label, value }: { label: string; value: string }) {
  return (
    <Text style={styles.karteSub}>
      <Text style={styles.karteSubLabel}>{label}: </Text>
      {value}
    </Text>
  );
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading, refetch } = useCustomerDetail(id);
  const { orders } = useCustomerOrders(id, 10);
  const { karte } = useCustomerKarte(id);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [phaseUpdating, setPhaseUpdating] = useState(false);

  async function updateSalesPhase(next: SalesPhase) {
    if (!detail || phaseUpdating) return;
    if (detail.sales_phase === next) return;
    setPhaseUpdating(true);
    const { error } = await supabase
      .from('customers')
      .update({ sales_phase: next })
      .eq('id', detail.id);
    setPhaseUpdating(false);
    if (error) {
      Alert.alert('フェーズ更新失敗', error.message);
      return;
    }
    await refetch();
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

  if (!detail) {
    return (
      <Screen back>
        <Text style={styles.notFound}>顧客が見つかりません</Text>
      </Screen>
    );
  }

  const status = deriveStatus(detail.last_ordered_at);
  const days = daysSince(detail.last_ordered_at);
  const suggestions = detail.recommendations;

  // 新スキーマの項目が1つでも埋まっていればカルテ有りとみなす（旧・厨房データのみの行は未登録扱い）
  const karteFilled = !!karte && (
    karte.store_count != null ||
    karte.operation_type != null ||
    karte.area_note != null ||
    karte.annual_revenue_note != null ||
    karte.listing_status != null ||
    karte.payment_terms != null ||
    karte.payment_method != null ||
    karte.credit_score != null ||
    karte.credit_limit_yen != null ||
    karte.order_style != null ||
    karte.delivery_style != null ||
    karte.decision_maker != null ||
    karte.competitor_supplier != null ||
    karte.signature_dish != null ||
    (Array.isArray(karte.target_segments) && karte.target_segments.length > 0) ||
    karte.needs_note != null ||
    karte.free_note != null
  );

  return (
    <Screen back>
      {/* 店舗画像ヒーロー */}
      <View style={styles.heroImage}>
        {detail.image_url ? (
          <View style={[styles.heroImg, styles.heroLogoWrap]}>
            <Image source={{ uri: detail.image_url }} style={{ width: '80%', height: '70%' }} contentFit="contain" />
          </View>
        ) : (
          <View style={[styles.heroImg, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderIcon}>🏪</Text>
            <Text style={styles.heroPlaceholderText}>
              {detail.business_type ?? '店舗'}
            </Text>
          </View>
        )}
      </View>

      {/* ヘッダ */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Badge label={STATUS_LABEL[status]} tone={STATUS_TONE[status]} size="md" dot />
          {detail.acquired_by_ranger_id ? (
            <Badge label={getPhaseLabel(detail.sales_phase)} tone={getPhaseTone(detail.sales_phase)} size="md" />
          ) : null}
        </View>
        <Text style={styles.name}>{detail.name}</Text>
        {detail.branch_name ? <Text style={styles.branch}>{detail.branch_name}</Text> : null}
        <Text style={styles.meta}>
          {detail.business_type ?? '—'}・{detail.address ?? '—'}
        </Text>
      </View>

      {/* サマリー3枚 */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>今月売上</Text>
          <Text style={styles.summaryValue}>{jpy(detail.monthSalesJpy)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>累計売上</Text>
          <Text style={styles.summaryValue}>{jpy(detail.totalSalesJpy)}</Text>
        </View>
        <View style={styles.summaryCardAccent}>
          <Text style={styles.summaryLabelAccent}>自分のマージン</Text>
          <Text style={styles.summaryValueAccent}>{jpy(detail.monthMarginJpy)}</Text>
        </View>
      </View>

      {/* 発注ステータスバナー */}
      <View style={[styles.statusBanner, styles[`banner_${status}`]]}>
        <Text style={styles.statusBannerIcon}>{status === 'follow' ? '⚠️' : status === 'stall' ? '⏳' : '✓'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.statusBannerTitle}>
            最終発注 {days == null ? '未発注' : `${days}日前`}
          </Text>
          <Text style={styles.statusBannerSub}>
            {status === 'follow' ? '今すぐ電話フォロー推奨' :
             status === 'stall' ? '新商品の提案で動きを作りましょう' :
             '順調です。次の提案ネタも用意しました'}
          </Text>
        </View>
      </View>

      {/* アクション */}
      <View style={styles.actionRow}>
        <Button
          label="編集"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push({ pathname: '/customer-edit/[id]', params: { id: detail.id } })}
        />
      </View>

      {/* ショールーム招待ボタン */}
      <View style={{ marginTop: 10 }}>
        <Button
          label="🏬 ショールームに招待"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => setInviteOpen(true)}
        />
      </View>

      <ShowroomInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        customerId={detail.id}
        customerName={detail.name}
      />

      {/* 営業フェーズ（レンジャー獲得顧客のみ） */}
      {detail.acquired_by_ranger_id ? (
        <>
          <SectionTitle
            title="営業フェーズ"
            caption={
              detail.sales_phase_updated_at
                ? `${shortDate(detail.sales_phase_updated_at)} 更新`
                : '未設定'
            }
          />
          <Card variant="surface" padding={14}>
            <View style={styles.phaseRow}>
              {SALES_PHASES.map((p) => {
                const active = detail.sales_phase === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => updateSalesPhase(p.key)}
                    disabled={phaseUpdating}
                    style={[styles.phaseBtn, active && styles.phaseBtnActive]}
                  >
                    <Text style={[styles.phaseBtnText, active && styles.phaseBtnTextActive]}>
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </>
      ) : null}

      {/* 悲鳴 */}
      {detail.painPoints.length > 0 && (
        <>
          <SectionTitle title="この店舗の悲鳴" caption="登録されたペインポイント" />
          <View style={styles.painRow}>
            {detail.painPoints.map((p) => <Badge key={p} label={p} tone="red" size="md" />)}
          </View>
        </>
      )}

      {/* カルテ */}
      <SectionTitle title="顧客カルテ" caption="企業概要・取引条件・商流" />
      {karteFilled ? (
        <Card variant="surface" padding={14}>
          <View style={styles.karteGrid}>
            <KarteItem label="店舗数" value={karte!.store_count != null ? `${karte!.store_count} 店` : '—'} />
            <KarteItem
              label="展開形態"
              value={karte!.operation_type ? OPERATION_LABEL[karte!.operation_type] : '—'}
            />
            <KarteItem
              label="上場区分"
              value={karte!.listing_status ? LISTING_LABEL[karte!.listing_status] : '—'}
            />
            <KarteItem
              label="与信スコア"
              value={karte!.credit_score != null ? `${karte!.credit_score} 点` : '—'}
            />
            <KarteItem
              label="与信限度額"
              value={karte!.credit_limit_yen != null ? jpy(karte!.credit_limit_yen) : '—'}
            />
            <KarteItem
              label="発注形態"
              value={karte!.order_style ? ORDER_STYLE_LABEL[karte!.order_style] : '—'}
            />
            <KarteItem
              label="物流形態"
              value={karte!.delivery_style ? DELIVERY_STYLE_LABEL[karte!.delivery_style] : '—'}
            />
          </View>

          <View style={styles.karteDivider} />

          {karte!.payment_terms ? <KarteLine label="締め支払い" value={karte!.payment_terms} /> : null}
          {karte!.payment_method ? (
            <KarteLine label="支払方法" value={PAYMENT_METHOD_LABEL[karte!.payment_method]} />
          ) : null}
          {karte!.area_note ? <KarteLine label="展開エリア" value={karte!.area_note} /> : null}
          {karte!.annual_revenue_note ? <KarteLine label="年商規模" value={karte!.annual_revenue_note} /> : null}
          {karte!.decision_maker ? <KarteLine label="キーマン" value={karte!.decision_maker} /> : null}
          {karte!.competitor_supplier ? <KarteLine label="競合仕入先" value={karte!.competitor_supplier} /> : null}
          {karte!.signature_dish ? <KarteLine label="看板商品" value={karte!.signature_dish} /> : null}
          {karte!.target_segments && karte!.target_segments.length > 0 ? (
            <KarteLine
              label="ターゲット客層"
              value={karte!.target_segments.map((s) => SEGMENT_LABEL[s] ?? s).join('・')}
            />
          ) : null}
          {karte!.needs_note ? <KarteLine label="提案ニーズ" value={karte!.needs_note} /> : null}
          {karte!.free_note ? <KarteLine label="メモ" value={karte!.free_note} /> : null}

          <Pressable
            onPress={() => router.push({ pathname: '/customer-karte/[id]', params: { id: detail.id } })}
            style={styles.karteEditBtn}
          >
            <Text style={styles.karteEditBtnText}>カルテを編集</Text>
          </Pressable>
        </Card>
      ) : (
        <Card variant="muted" padding={16}>
          <Text style={styles.karteEmptyText}>カルテ未登録</Text>
          <Text style={styles.karteEmptySub}>
            企業概要・取引条件（与信/支払）・商流を登録すると、担当交代や提案時にすぐ把握できます
          </Text>
          <View style={{ marginTop: 12 }}>
            <Button
              label="＋ カルテを作成"
              variant="primary"
              size="md"
              fullWidth
              onPress={() => router.push({ pathname: '/customer-karte/[id]', params: { id: detail.id } })}
            />
          </View>
        </Card>
      )}

      {/* 提案候補 */}
      <SectionTitle title="次の提案候補" caption="適合度順" />
      {suggestions.length === 0 ? (
        <Card variant="muted" padding={16}>
          <Text style={styles.emptyInline}>推薦商品がまだ生成されていません</Text>
        </Card>
      ) : (
        <View style={{ gap: 10, marginBottom: 18 }}>
          {suggestions.map((s) => (
            <Card key={s.id} variant="surface" padding={14}>
              <View style={styles.suggRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggName}>{s.product_name}</Text>
                  {s.pitch_script ? (
                    <Text style={styles.suggPitch} numberOfLines={2}>{s.pitch_script}</Text>
                  ) : null}
                </View>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreText}>{Math.round(s.score * 100)}</Text>
                  <Text style={styles.scoreUnit}>%</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* 直近の受注 */}
      <SectionTitle title="直近の受注" caption={`${orders.length} 件`} />
      {orders.length === 0 ? (
        <Card variant="muted" padding={16}>
          <Text style={styles.emptyInline}>まだ受注がありません</Text>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {orders.map((o) => (
            <Card key={o.id} variant="surface" padding={14}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderDate}>{shortDate(o.ordered_at)}</Text>
                {o.source === 'ec' ? (
                  <View style={styles.ecOrderTag}>
                    <Text style={styles.ecOrderTagText}>🔗 EC</Text>
                  </View>
                ) : null}
                {o.source === 'bcart' ? (
                  <View style={styles.bcartOrderTag}>
                    <Text style={styles.bcartOrderTagText}>🏢 Bカート</Text>
                  </View>
                ) : null}
                <Badge label={ORDER_STATUS_LABEL[o.status]} tone={ORDER_STATUS_TONE[o.status]} />
                <Text style={styles.orderAmount}>{jpy(o.total_amount_jpy)}</Text>
              </View>
              {o.source === 'ec' ? (
                <Text style={styles.ecOrderSub}>foodboat.jp 経由の自動受注</Text>
              ) : o.source === 'bcart' ? (
                <Text style={styles.bcartOrderSub}>Bカート経由の直接取引（自動同期）</Text>
              ) : (
                o.items.map((item, idx) => (
                  <Text key={idx} style={styles.orderItemText}>
                    ・{item.product_name} × {item.quantity.toLocaleString()}
                  </Text>
                ))
              )}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { paddingVertical: 48, textAlign: 'center', color: Ink[500] },

  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Ink[100],
  },
  heroImg: { width: '100%', height: '100%' },
  heroLogoWrap: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  heroPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(30,58,95,0.04)',
    borderWidth: 1,
    borderColor: Ink[100],
  },
  heroPlaceholderIcon: { fontSize: 48 },
  heroPlaceholderText: { fontSize: 12, color: Ink[500], fontWeight: '700', letterSpacing: 1 },

  name: { fontSize: 24, fontWeight: '800', color: Ink[900], marginTop: 8, letterSpacing: -0.3 },
  branch: { fontSize: 14, color: Ink[700], marginTop: 2, fontWeight: '600' },
  meta: { fontSize: 11, color: Ink[500], marginTop: 4 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  summaryCardAccent: {
    flex: 1,
    backgroundColor: Brand.navy,
    borderRadius: Radius.md,
    padding: 12,
  },
  summaryLabel: { fontSize: 10, color: Ink[500], letterSpacing: 0.3, fontWeight: '700' },
  summaryValue: { fontSize: 15, fontWeight: '800', color: Ink[900], marginTop: 6 },
  summaryLabelAccent: { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3, fontWeight: '700' },
  summaryValueAccent: { fontSize: 15, fontWeight: '800', color: '#fff', marginTop: 6 },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 14,
  },
  banner_good: { backgroundColor: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.25)' },
  banner_stall: { backgroundColor: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.3)' },
  banner_follow: { backgroundColor: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.35)' },
  statusBannerIcon: { fontSize: 22 },
  statusBannerTitle: { fontSize: 13, fontWeight: '800', color: Ink[900] },
  statusBannerSub: { fontSize: 11, color: Ink[600], marginTop: 2 },

  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },

  painRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 18 },
  emptyInline: { fontSize: 12, color: Ink[500], textAlign: 'center' },

  suggRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  suggPitch: { fontSize: 11, color: Ink[500], marginTop: 4, lineHeight: 15 },
  scoreBox: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Brand.navy, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 1,
  },
  scoreText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  scoreUnit: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4 },

  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  orderDate: { fontSize: 11, color: Ink[500], fontWeight: '700', minWidth: 56 },
  orderAmount: { fontSize: 14, fontWeight: '800', color: Ink[900], flex: 1, textAlign: 'right' },
  orderItemText: { fontSize: 12, color: Ink[700], marginTop: 2, lineHeight: 16 },
  ecOrderTag: {
    backgroundColor: 'rgba(201,168,118,0.15)',
    borderColor: Brand.gold,
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  ecOrderTagText: { color: Brand.gold, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  ecOrderSub: { fontSize: 11, color: Brand.gold, fontStyle: 'italic', marginTop: 2 },
  bcartOrderTag: {
    backgroundColor: 'rgba(30,58,95,0.10)',
    borderColor: Brand.navy,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  bcartOrderTagText: { color: Brand.navy, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  bcartOrderSub: { fontSize: 11, color: Brand.navy, fontStyle: 'italic', marginTop: 2 },

  karteGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  karteItem: { width: '50%', paddingVertical: 6 },
  karteItemLabel: { fontSize: 10, color: Ink[500], fontWeight: '700', letterSpacing: 0.3 },
  karteItemValue: { fontSize: 13, color: Ink[900], fontWeight: '700', marginTop: 2 },
  karteDivider: { height: 1, backgroundColor: Ink[100], marginTop: 12, marginBottom: 4 },
  karteSub: { fontSize: 12, color: Ink[700], marginTop: 6, lineHeight: 17 },
  karteSubLabel: { color: Ink[500], fontWeight: '700' },
  karteEditBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Ink[200],
    alignItems: 'center',
  },
  karteEditBtnText: { fontSize: 12, color: Ink[700], fontWeight: '700' },
  karteEmptyText: { fontSize: 13, color: Ink[700], fontWeight: '700', textAlign: 'center' },
  karteEmptySub: { fontSize: 11, color: Ink[500], textAlign: 'center', marginTop: 4, lineHeight: 16 },

  phaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  phaseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Ink[200],
    backgroundColor: '#fff',
  },
  phaseBtnActive: { backgroundColor: Brand.navy, borderColor: Brand.navy },
  phaseBtnText: { fontSize: 12, fontWeight: '700', color: Ink[700] },
  phaseBtnTextActive: { color: '#fff' },
});
