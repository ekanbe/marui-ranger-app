import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerList } from '@/components/ui/Shimmer';
import { Brand, Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { type DerivedStatus, deriveStatus, useCustomers } from '@/hooks/use-customers';
import { useProfile } from '@/hooks/use-profile';
import { daysSince } from '@/lib/format';
import { getPhaseLabel, getPhaseTone } from '@/lib/sales-phase';

type Filter = 'all' | DerivedStatus;

const STATUS_LABEL: Record<DerivedStatus, string> = { good: '好調', stall: '停滞', follow: '要フォロー' };
const STATUS_TONE: Record<DerivedStatus, 'emerald' | 'amber' | 'red'> = {
  good: 'emerald',
  stall: 'amber',
  follow: 'red',
};

export default function CustomersScreen() {
  const { customers, loading } = useCustomers();
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const isAdmin = profile?.role === 'admin';
  const [filter, setFilter] = useState<Filter>('all');
  const [bizFilter, setBizFilter] = useState<string>('all');
  const [query, setQuery] = useState('');

  const enriched = useMemo(
    () => customers.map((c) => ({ ...c, derivedStatus: deriveStatus(c.last_ordered_at) })),
    [customers]
  );

  const counts = useMemo(
    () => ({
      all: enriched.length,
      good: enriched.filter((c) => c.derivedStatus === 'good').length,
      stall: enriched.filter((c) => c.derivedStatus === 'stall').length,
      follow: enriched.filter((c) => c.derivedStatus === 'follow').length,
    }),
    [enriched]
  );

  const bizTypes = useMemo(() => {
    const set = new Set<string>();
    enriched.forEach((c) => { if (c.business_type) set.add(c.business_type); });
    return Array.from(set).sort();
  }, [enriched]);

  const list = enriched.filter(
    (c) =>
      (filter === 'all' || c.derivedStatus === filter) &&
      (bizFilter === 'all' || c.business_type === bizFilter) &&
      (query === '' || `${c.name}${c.branch_name ?? ''}${c.address ?? ''}`.includes(query))
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{isAdmin ? '全店舗' : '担当店舗'}</Text>
          <Text style={styles.subtitle}>
            {isAdmin ? `${enriched.length} 店（全社）` : `${enriched.length} 店を担当中`}
          </Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => router.push('/customer-new')}>
          <Text style={styles.addBtnText}>＋</Text>
        </Pressable>
      </View>

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

      {/* ステータスフィルタ */}
      <ChipRow style={{ marginBottom: 10 }}>
        <Chip label="すべて" count={counts.all} active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="好調" count={counts.good} active={filter === 'good'} onPress={() => setFilter('good')} />
        <Chip label="停滞" count={counts.stall} active={filter === 'stall'} onPress={() => setFilter('stall')} />
        <Chip label="要フォロー" count={counts.follow} active={filter === 'follow'} onPress={() => setFilter('follow')} />
      </ChipRow>

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

      {/* リスト */}
      {loading ? (
        <ShimmerList count={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="該当する店舗がありません"
          message="検索条件やフィルタを変えてみてください"
          actionLabel={query ? '検索をクリア' : undefined}
          onAction={query ? () => setQuery('') : undefined}
        />
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
                  <View style={styles.thumbWrap}>
                    {c.image_url ? (
                      <Image source={{ uri: c.image_url }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <Text style={{ fontSize: 26 }}>🏪</Text>
                      </View>
                    )}
                  </View>
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
                    <Text style={[styles.daysValue, alert && { color: '#DC2626' }]}>{daysText}</Text>
                    <Text style={styles.daysLabel}>最終発注</Text>
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
  addBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.navy,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Brand.navyDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 24, fontWeight: '500' },

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
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: Ink[900], padding: 0 },
  clearIcon: { fontSize: 14, color: Ink[400], paddingHorizontal: 4 },

  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  cardAlert: { borderWidth: 2, borderColor: 'rgba(239,68,68,0.35)', backgroundColor: 'rgba(239,68,68,0.02)' },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },

  thumbWrap: {
    width: 68, height: 68, borderRadius: Radius.md,
    overflow: 'hidden', backgroundColor: Ink[100],
  },
  thumb: { width: 68, height: 68 },
  thumbPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(30,58,95,0.04)',
  },

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
