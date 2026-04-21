import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { daysSince, jpy } from '@/lib/format';
import { customers, type CustomerStatus } from '@/lib/mockData';

type Filter = 'all' | CustomerStatus;

const STATUS_LABEL: Record<CustomerStatus, string> = { good: '好調', stall: '停滞', follow: '要フォロー' };
const STATUS_COLOR: Record<CustomerStatus, string> = { good: Accent.emerald, stall: Accent.amber, follow: Accent.red };

export default function CustomersScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const counts = useMemo(() => ({
    all: customers.length,
    good: customers.filter(c => c.status === 'good').length,
    stall: customers.filter(c => c.status === 'stall').length,
    follow: customers.filter(c => c.status === 'follow').length,
  }), []);

  const list = customers.filter(c =>
    (filter === 'all' || c.status === filter) &&
    (query === '' || (c.name + c.branch).includes(query))
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>担当店舗</Text>
        <Pressable style={styles.addBtn}><Text style={styles.addBtnText}>+</Text></Pressable>
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
        {([
          ['all', `すべて ${counts.all}`],
          ['good', `好調 ${counts.good}`],
          ['stall', `停滞 ${counts.stall}`],
          ['follow', `要フォロー ${counts.follow}`],
        ] as const).map(([k, label]) => {
          const active = filter === k;
          return (
            <Pressable key={k} onPress={() => setFilter(k as Filter)}
              style={[styles.filterBtn, active && styles.filterBtnActive]}>
              <Text style={[styles.filterText, active && styles.filterTextActive, k === 'follow' && !active && { color: Accent.red }]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ gap: 12 }}>
        {list.map(c => {
          const days = daysSince(c.lastOrderedAt) ?? 0;
          const alert = c.status === 'follow';
          return (
            <Pressable key={c.id} onPress={() => router.push({ pathname: '/customer/[id]', params: { id: c.id } })}
              style={[styles.card, alert && styles.cardAlert]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.statusRow}>
                    <View style={[styles.dot, { backgroundColor: STATUS_COLOR[c.status] }]} />
                    <Text style={[styles.statusText, { color: STATUS_COLOR[c.status] }]}>{STATUS_LABEL[c.status]}</Text>
                  </View>
                  <Text style={styles.custName}>{c.name} {c.branch}</Text>
                  <Text style={styles.custMeta}>{c.businessType} / {c.address}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.salesValue}>{jpy(c.monthSalesJpy)}</Text>
                  <Text style={styles.salesLabel}>今月</Text>
                  <Text style={styles.totalValue}>{jpy(c.totalSalesJpy)}</Text>
                  <Text style={styles.salesLabel}>累計</Text>
                </View>
              </View>
              <View style={[styles.cardBottom, alert && { borderTopColor: 'rgba(239,68,68,0.25)' }]}>
                <Text style={[styles.lastOrdered, alert && { color: Accent.red, fontWeight: '600' }]}>
                  最終発注 <Text style={{ fontWeight: '700' }}>{days}日前</Text>
                </Text>
                <Text style={styles.nextAction}>
                  {alert ? '電話フォロー推奨 →' : '次：提案を確認 →'}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Ink[900] },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Ink[100], alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: Ink[700], fontSize: 20, lineHeight: 22 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: Ink[100],
    borderRadius: Radius.lg, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  searchIcon: { color: Ink[500], fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: Ink[900] },

  filterScroll: { marginBottom: 14, flexGrow: 0 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: Ink[100] },
  filterBtnActive: { backgroundColor: Brand.navy, borderColor: Brand.navy },
  filterText: { fontSize: 12, color: Ink[700], fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Ink[100] },
  cardAlert: { borderWidth: 2, borderColor: 'rgba(239,68,68,0.4)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  custName: { fontSize: 16, fontWeight: '700', color: Ink[900], marginTop: 4 },
  custMeta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  salesValue: { fontSize: 18, fontWeight: '800', color: Ink[900] },
  salesLabel: { fontSize: 10, color: Ink[500] },
  totalValue: { fontSize: 11, fontWeight: '600', color: Ink[700], marginTop: 4 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: Ink[100] },
  lastOrdered: { fontSize: 11, color: Ink[500] },
  nextAction: { fontSize: 11, color: Brand.navy, fontWeight: '600' },
});
