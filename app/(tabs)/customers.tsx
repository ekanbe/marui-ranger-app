import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { CustomerThumb } from '@/components/ui/CustomerThumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerList } from '@/components/ui/Shimmer';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { type DerivedStatus, deriveStatus, useCustomers } from '@/hooks/use-customers';
import { type DormancyLevel, useDormantCustomers } from '@/hooks/use-dormant-customers';
import { useProfile } from '@/hooks/use-profile';
import { daysSince, jpy } from '@/lib/format';
import { getPhaseLabel, getPhaseTone, SALES_PHASES, type SalesPhase } from '@/lib/sales-phase';

type Filter = 'all' | DerivedStatus;
type DormancyFilter = null | 'all' | 'warning' | 'danger' | 'critical';
type SortKey = 'recent' | 'sales' | 'name';

const SORT_LABEL: Record<SortKey, string> = { recent: '最終発注順', sales: '売上順', name: '店名順' };

const STATUS_LABEL: Record<DerivedStatus, string> = { good: '好調', stall: '停滞', follow: '要フォロー' };
const STATUS_TONE: Record<DerivedStatus, 'emerald' | 'amber' | 'red'> = {
  good: 'emerald',
  stall: 'amber',
  follow: 'red',
};

const DORMANCY_LABEL: Record<Exclude<DormancyFilter, null>, string> = {
  all: '要フォロー（30日以上未発注）',
  warning: '🟡 30日〜60日未発注',
  danger: '🟠 60日〜90日未発注',
  critical: '🔴 90日以上未発注',
};

function showStatusInfo() {
  const message =
    '🟢 好調：最終発注から14日未満\n' +
    '🟡 停滞：最終発注から14〜30日\n' +
    '🔴 要フォロー：最終発注から30日以上、または発注履歴なし';
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
  } else {
    Alert.alert('ステータスの基準', message);
  }
}

export default function CustomersScreen() {
  const { customers, loading, error, reload } = useCustomers();
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const isAdmin = profile?.role === 'admin';
  const params = useLocalSearchParams<{ phase?: string; dormancy?: string }>();
  const [segment, setSegment] = useState<'existing' | 'prospect'>('existing');
  const [filter, setFilter] = useState<Filter>('all');
  const [bizFilter, setBizFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<SalesPhase | null>(null);
  const [dormancyFilter, setDormancyFilter] = useState<DormancyFilter>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');

  // 取引断絶検知（DEVICE A）— 担当範囲の全顧客（includeAll で active も含めて取得）
  const { customers: dormantRows } = useDormantCustomers(
    { rangerId: session?.user.id ?? null, isAdmin },
    { includeAll: true },
  );
  const dormancyMap = useMemo(() => {
    const m = new Map<string, DormancyLevel>();
    for (const r of dormantRows) m.set(r.customer_id, r.dormancy_level);
    return m;
  }, [dormantRows]);

  // ホームの「獲得顧客のフェーズ」バッジから飛んできたとき、新規開拓タブ+フェーズを反映
  useEffect(() => {
    if (params.phase && SALES_PHASES.some((p) => p.key === params.phase)) {
      setSegment('prospect');
      setPhaseFilter(params.phase as SalesPhase);
    }
  }, [params.phase]);

  // 取引断絶検知バッジから飛んできたとき、初期 dormancy フィルタを反映
  useEffect(() => {
    if (params.dormancy && ['all', 'warning', 'danger', 'critical'].includes(params.dormancy)) {
      setDormancyFilter(params.dormancy as Exclude<DormancyFilter, null>);
    }
  }, [params.dormancy]);

  function matchesDormancy(customerId: string): boolean {
    if (dormancyFilter === null) return true;
    const lv = dormancyMap.get(customerId);
    if (!lv) return false;
    if (dormancyFilter === 'all') return lv === 'warning' || lv === 'danger' || lv === 'critical';
    return lv === dormancyFilter;
  }

  const enriched = useMemo(
    () => customers.map((c) => ({ ...c, derivedStatus: deriveStatus(c.last_ordered_at) })),
    [customers]
  );

  // 既存(VIPS由来) / 新規開拓(レンジャー獲得) のすみわけ
  const existing = useMemo(() => enriched.filter((c) => !c.acquired_by_ranger_id), [enriched]);
  const prospects = useMemo(() => enriched.filter((c) => c.acquired_by_ranger_id), [enriched]);

  const counts = useMemo(
    () => ({
      all: existing.length,
      good: existing.filter((c) => c.derivedStatus === 'good').length,
      stall: existing.filter((c) => c.derivedStatus === 'stall').length,
      follow: existing.filter((c) => c.derivedStatus === 'follow').length,
    }),
    [existing]
  );

  const phaseCounts = useMemo(() => {
    const m: Partial<Record<SalesPhase, number>> = {};
    prospects.forEach((c) => {
      if (c.sales_phase) m[c.sales_phase] = (m[c.sales_phase] ?? 0) + 1;
    });
    return m;
  }, [prospects]);

  const bizTypes = useMemo(() => {
    const set = new Set<string>();
    existing.forEach((c) => { if (c.business_type) set.add(c.business_type); });
    return Array.from(set).sort();
  }, [existing]);

  const matchesQuery = (c: (typeof enriched)[number]) =>
    query === '' || `${c.name}${c.branch_name ?? ''}${c.address ?? ''}`.includes(query);

  const filtered =
    segment === 'existing'
      ? existing.filter(
          (c) =>
            (filter === 'all' || c.derivedStatus === filter) &&
            (bizFilter === 'all' || c.business_type === bizFilter) &&
            matchesDormancy(c.id) &&
            matchesQuery(c)
        )
      : prospects.filter(
          (c) => (phaseFilter === null || c.sales_phase === phaseFilter) && matchesQuery(c)
        );

  const phaseOrder = (p: SalesPhase | null) => {
    const i = SALES_PHASES.findIndex((s) => s.key === p);
    return i === -1 ? 99 : i;
  };
  // 'recent' は useCustomers 側で last_ordered_at desc 済みなのでソート不要
  const list =
    segment === 'prospect'
      ? [...filtered].sort((a, b) => phaseOrder(a.sales_phase) - phaseOrder(b.sales_phase))
      : sortKey === 'sales'
        ? [...filtered].sort((a, b) => b.total_sales_jpy - a.total_sales_jpy)
        : sortKey === 'name'
          ? [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'ja'))
          : filtered;

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{isAdmin ? '全店舗' : '担当店舗'}</Text>
          <Text style={styles.subtitle}>
            {isAdmin ? `${enriched.length} 店（全社）` : `${enriched.length} 店を担当中`}
          </Text>
        </View>
      </View>

      {/* 既存 / 新規開拓 切替 */}
      <View style={styles.segmentRow}>
        <Pressable
          onPress={() => setSegment('existing')}
          style={[styles.segmentBtn, segment === 'existing' && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, segment === 'existing' && styles.segmentTextActive]}>
            既存 {existing.length}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSegment('prospect')}
          style={[styles.segmentBtn, segment === 'prospect' && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, segment === 'prospect' && styles.segmentTextActive]}>
            新規開拓 {prospects.length}
          </Text>
        </Pressable>
      </View>

      {/* フェーズフィルタ適用中のバナー */}
      {segment === 'prospect' && phaseFilter ? (
        <Pressable onPress={() => setPhaseFilter(null)} style={styles.phaseBanner}>
          <Text style={styles.phaseBannerIcon}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.phaseBannerTitle}>
              「{getPhaseLabel(phaseFilter)}」フェーズで絞り込み中
            </Text>
            <Text style={styles.phaseBannerSub}>{list.length} 件 ／ タップで解除</Text>
          </View>
          <Text style={styles.phaseBannerClose}>✕</Text>
        </Pressable>
      ) : null}

      {/* 取引断絶検知フィルタ適用中のバナー */}
      {segment === 'existing' && dormancyFilter ? (
        <Pressable onPress={() => setDormancyFilter(null)} style={styles.dormancyBanner}>
          <Text style={styles.dormancyBannerIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.dormancyBannerTitle}>
              {DORMANCY_LABEL[dormancyFilter]}で絞り込み中
            </Text>
            <Text style={styles.dormancyBannerSub}>{list.length} 件 ／ タップで解除</Text>
          </View>
          <Text style={styles.dormancyBannerClose}>✕</Text>
        </Pressable>
      ) : null}

      {/* 検索バー */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="店名・住所・業種で検索"
          placeholderTextColor={Ink[400]}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {segment === 'existing' ? (
        <>
          {/* ステータスフィルタ */}
          <ChipRow style={{ marginBottom: 4 }}>
            <Chip label="すべて" count={counts.all} active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="好調" count={counts.good} active={filter === 'good'} onPress={() => setFilter('good')} />
            <Chip label="停滞" count={counts.stall} active={filter === 'stall'} onPress={() => setFilter('stall')} />
            <Chip label="要フォロー" count={counts.follow} active={filter === 'follow'} onPress={() => setFilter('follow')} />
          </ChipRow>
          <Pressable onPress={showStatusInfo} hitSlop={6} style={{ marginBottom: 10 }}>
            <Text style={styles.statusInfoText}>ⓘ 好調・停滞・要フォローの基準を見る</Text>
          </Pressable>

          {/* 業種フィルタ */}
          {bizTypes.length > 0 && (
            <ChipRow style={{ marginBottom: 16 }}>
              <Chip label="業種: すべて" active={bizFilter === 'all'} onPress={() => setBizFilter('all')} />
              {bizTypes.map((t) => (
                <Chip
                  key={`b-${t}`}
                  label={t}
                  active={bizFilter === t}
                  onPress={() => setBizFilter(bizFilter === t ? 'all' : t)}
                />
              ))}
            </ChipRow>
          )}

          {/* 並び替え */}
          <ChipRow style={{ marginBottom: 16 }}>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <Chip key={k} label={SORT_LABEL[k]} active={sortKey === k} onPress={() => setSortKey(k)} />
            ))}
          </ChipRow>
        </>
      ) : (
        <>
          {/* 新規開拓: 登録ボタン + フェーズフィルタ */}
          <View style={{ marginBottom: 12 }}>
            <Button
              label="＋ 新規開拓の顧客を登録"
              variant="primary"
              size="md"
              fullWidth
              onPress={() => router.push('/prospect-new')}
            />
          </View>
          <ChipRow style={{ marginBottom: 16 }}>
            <Chip label="全フェーズ" count={prospects.length} active={phaseFilter === null} onPress={() => setPhaseFilter(null)} />
            {SALES_PHASES.map((p) => (
              <Chip
                key={p.key}
                label={p.label}
                count={phaseCounts[p.key] ?? 0}
                active={phaseFilter === p.key}
                onPress={() => setPhaseFilter(phaseFilter === p.key ? null : p.key)}
              />
            ))}
          </ChipRow>
        </>
      )}

      {/* リスト */}
      {loading ? (
        <ShimmerList count={4} />
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="読み込みに失敗しました"
          message={error}
          actionLabel="再読み込み"
          onAction={reload}
        />
      ) : list.length === 0 ? (
        segment === 'prospect' && prospects.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="新規開拓の顧客はまだありません"
            message="開拓中の見込み客を登録すると、与信→商談→サンプル→見積→発注のフェーズで進捗を追えます"
            actionLabel="＋ 新規開拓の顧客を登録"
            onAction={() => router.push('/prospect-new')}
          />
        ) : (
          <EmptyState
            icon="🏪"
            title="該当する店舗がありません"
            message="検索条件やフィルタを変えてみてください"
            actionLabel={query ? '検索をクリア' : undefined}
            onAction={query ? () => setQuery('') : undefined}
          />
        )
      ) : segment === 'prospect' ? (
        <View style={{ gap: 12 }}>
          {list.map((c) => {
            const days = daysSince(c.last_ordered_at);
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: c.id } })}
                style={styles.card}
              >
                <View style={styles.cardTop}>
                  <CustomerThumb imageUrl={c.image_url} size={68} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      <Badge
                        label={getPhaseLabel(c.sales_phase)}
                        tone={getPhaseTone(c.sales_phase)}
                        size="sm"
                      />
                      {c.last_ordered_at ? (
                        <Badge
                          label={STATUS_LABEL[c.derivedStatus]}
                          tone={STATUS_TONE[c.derivedStatus]}
                          size="sm"
                          dot
                        />
                      ) : null}
                    </View>
                    <Text style={styles.custName} numberOfLines={1}>
                      {c.name}
                      {c.branch_name ? ` ${c.branch_name}` : ''}
                    </Text>
                    <Text style={styles.custMeta} numberOfLines={1}>
                      {c.business_type ?? '—'}・{c.address ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.daysBox}>
                    <Text style={styles.daysValue}>{days == null ? '—' : `${days}日`}</Text>
                    <Text style={styles.daysLabel}>{days == null ? '受注前' : '最終発注'}</Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.lastOrdered}>🌱 自分で開拓した新規顧客</Text>
                  <Text style={styles.nextAction}>詳細を見る →</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((c) => {
            const days = daysSince(c.last_ordered_at);
            const daysText = days == null ? '未発注' : `${days}日`;
            const alert = c.derivedStatus === 'follow';

            return (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: c.id } })}
                style={[styles.card, alert && styles.cardAlert]}
              >
                <View style={styles.cardTop}>
                  <CustomerThumb imageUrl={c.image_url} size={68} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      <Badge
                        label={STATUS_LABEL[c.derivedStatus]}
                        tone={STATUS_TONE[c.derivedStatus]}
                        size="sm"
                        dot
                      />
                      {c.acquired_by_ranger_id ? (
                        <Badge
                          label={getPhaseLabel(c.sales_phase)}
                          tone={getPhaseTone(c.sales_phase)}
                          size="sm"
                        />
                      ) : null}
                    </View>
                    <Text style={styles.custName} numberOfLines={1}>
                      {c.name}
                      {c.branch_name ? ` ${c.branch_name}` : ''}
                    </Text>
                    <Text style={styles.custMeta} numberOfLines={1}>
                      {c.business_type ?? '—'}・{c.address ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.daysBox}>
                    {sortKey === 'sales' ? (
                      <>
                        <Text style={[styles.daysValue, { fontSize: 15 }]} numberOfLines={1}>
                          {jpy(c.total_sales_jpy)}
                        </Text>
                        <Text style={styles.daysLabel}>累計売上</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.daysValue, alert && { color: '#DC2626' }]}>{daysText}</Text>
                        <Text style={styles.daysLabel}>最終発注</Text>
                      </>
                    )}
                  </View>
                </View>
                <View style={[styles.cardBottom, alert && { borderTopColor: 'rgba(239,68,68,0.2)' }]}>
                  <Text style={[styles.lastOrdered, alert && { color: '#DC2626', fontWeight: '700' }]}>
                    {alert ? '⚠️ しばらく発注なし' : '✓ 順調'}
                  </Text>
                  <Text style={styles.nextAction}>
                    {alert ? '今すぐフォロー →' : '詳細を見る →'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: Ink[500], marginTop: 4 },

  segmentRow: {
    flexDirection: 'row',
    backgroundColor: Ink[100],
    borderRadius: Radius.md,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 13, fontWeight: '700', color: Ink[500] },
  segmentTextActive: { color: Brand.navy, fontWeight: '800' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[200],
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  phaseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(201,168,118,0.12)',
    borderWidth: 1,
    borderColor: Brand.gold,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  phaseBannerIcon: { fontSize: 18 },
  phaseBannerTitle: { fontSize: 13, fontWeight: '800', color: Brand.navy },
  phaseBannerSub: { fontSize: 11, color: Ink[600], marginTop: 2 },
  phaseBannerClose: { fontSize: 16, color: Brand.navy, fontWeight: '700', paddingHorizontal: 4 },

  dormancyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(220,38,38,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.25)',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  dormancyBannerIcon: { fontSize: 18 },
  dormancyBannerTitle: { fontSize: 13, fontWeight: '800', color: '#991B1B' },
  dormancyBannerSub: { fontSize: 11, color: '#7F1D1D', marginTop: 2 },
  dormancyBannerClose: { fontSize: 16, color: '#991B1B', fontWeight: '700', paddingHorizontal: 4 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: Ink[900], padding: 0 },
  clearIcon: { fontSize: 14, color: Ink[400], paddingHorizontal: 4 },
  statusInfoText: { fontSize: 11, color: Ink[500], fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  cardAlert: { borderWidth: 2, borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.02)' },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },


  custName: { fontSize: 15, fontWeight: '800', color: Ink[900], marginTop: 6 },
  custMeta: { fontSize: 11, color: Ink[500], marginTop: 4 },
  daysBox: { alignItems: 'flex-end' },
  daysValue: { fontSize: 20, fontWeight: '800', color: Ink[900] },
  daysLabel: { fontSize: 10, color: Ink[500], marginTop: 2 },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Ink[100],
  },
  lastOrdered: { fontSize: 11, color: Ink[500] },
  nextAction: { fontSize: 11, color: Ink[900], fontWeight: '700' },
});
