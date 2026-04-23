import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { type DerivedStatus, deriveStatus, useCustomers } from '@/hooks/use-customers';
import { daysSince } from '@/lib/format';

type Filter = 'all' | DerivedStatus;

const STATUS_LABEL: Record<DerivedStatus, string> = { good: '好調', stall: '停滞', follow: '要フォロー' };
const STATUS_COLOR: Record<DerivedStatus, string> = { good: Accent.emerald, stall: Accent.amber, follow: Accent.red };

export default function CustomersScreen() {
  const { customers, loading } = useCustomers();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const enriched = useMemo(
    () =>
      customers.map((c) => ({
        ...c,
        derivedStatus: deriveStatus(c.last_ordered_at),
      })),
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

  const list = enriched.filter(
    (c) =>
      (filter === 'all' || c.derivedStatus === filter) &&
      (query === '' || `${c.name}${c.branch_name ?? ''}`.includes(query))
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>担当店舗</Text>
        <Pressable style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="店名で検索"
          placeholderTextColor={Ink[500]}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 8 }}>
        {(
          [
            ['all', `すべて ${counts.all}`],
            ['good', `好調 ${counts.good}`],
            ['stall', `停滞 ${counts.stall}`],
            ['follow', `要フォロー ${counts.follow}`],
          ] as const
        ).map(([k, label]) => {
          const active = filter === k;
          return (
            <Pressable
              key={k}
              onPress={() => setFilter(k as Filter)}
              style={[styles.filterBtn, active && styles.filterBtnActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  active && styles.filterTextActive,
                  k === 'follow' && !active && { color: Accent.red },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      ) : list.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>該当する店舗がありません</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((c) => {
            const days = daysSince(c.last_ordered_at) ?? 0;
            const alert = c.derivedStatus === 'follow';
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: c.id } })}
                style={[styles.card, alert && styles.cardAlert]}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.statusRow}>
                      <View style={[styles.dot, { backgroundColor: STATUS_COLOR[c.derivedStatus] }]} />
                      <Text style={[styles.statusText, { color: STATUS_COLOR[c.derivedStatus] }]}>
                        {STATUS_LABEL[c.derivedStatus]}
                      </Text>
                    </View>
                    <Text style={styles.custName}>
                      {c.name}
                      {c.branch_name ? ` ${c.branch_name}` : ''}
                    </Text>
                    <Text style={styles.custMeta}>
                      {c.business_type ?? '-'} / {c.address ?? '-'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.daysValue}>{days}日</Text>
                    <Text style={styles.salesLabel}>最終発注から</Text>
                  </View>
                </View>
                <View style={[styles.cardBottom, alert && { borderTopColor: 'rgba(239,68,68,0.25)' }]}>
                  <Text style={[styles.lastOrdered, alert && { color: Accent.red, fontWeight: '600' }]}>
                    {alert ? 'しばらく発注なし' : '順調'}
                  </Text>
                  <Text style={styles.nextAction}>{alert ? '電話フォロー推奨 →' : '詳細を見る →'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Ink[900] },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Ink[100], alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: Ink[700], fontSize: 20, lineHeight: 22 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[100],
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchIcon: { color: Ink[500], fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: Ink[900] },

  filterScroll: { marginBottom: 14, flexGrow: 0 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[100],
  },
  filterBtnActive: { backgroundColor: Brand.navy, borderColor: Brand.navy },
  filterText: { fontSize: 12, color: Ink[700], fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  emptyBox: { paddingVertical: 48, alignItems: 'center' },
  emptyText: { color: Ink[500], fontSize: 13 },

  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Ink[100] },
  cardAlert: { borderWidth: 2, borderColor: 'rgba(239,68,68,0.4)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  custName: { fontSize: 16, fontWeight: '700', color: Ink[900], marginTop: 4 },
  custMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  daysValue: { fontSize: 22, fontWeight: '800', color: Ink[900] },
  salesLabel: { fontSize: 10, color: Ink[500] },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: Ink[100] },
  lastOrdered: { fontSize: 11, color: Ink[500] },
  nextAction: { fontSize: 11, color: Brand.navy, fontWeight: '600' },
});
