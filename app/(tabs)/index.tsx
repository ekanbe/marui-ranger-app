import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ranger/ProgressBar';
import { Screen } from '@/components/ranger/Screen';
import { StatCard } from '@/components/ranger/StatCard';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { jpy, pct } from '@/lib/format';
import { homeKpis, rangerProfile, todayTodos } from '@/lib/mockData';

export default function HomeScreen() {
  return (
    <Screen>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>おはようございます</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{rangerProfile.name}</Text>
            <View style={styles.rankPill}><Text style={styles.rankText}>{rangerProfile.rank.toUpperCase()}</Text></View>
          </View>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{rangerProfile.avatarInitial}</Text></View>
      </View>

      {/* ヒーロー：今月売上 */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>今月の売上</Text>
        <Text style={styles.heroValue}>{jpy(homeKpis.monthSalesJpy)}</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroGrowth}>▲ {pct(homeKpis.monthGrowthPct)}</Text>
          <Text style={styles.heroPrev}>前月比 {jpy(homeKpis.prevMonthSalesJpy)}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>今月の目標</Text>
          <Text style={styles.goalPct}>{pct(homeKpis.goalProgressPct)}</Text>
        </View>
        <ProgressBar progress={homeKpis.goalProgressPct} height={8} />
        <Text style={styles.goalRemaining}>
          あと <Text style={styles.goalRemainingStrong}>{jpy(homeKpis.remainingToGoalJpy)}</Text> で達成
        </Text>
      </View>

      {/* KPIカード 2x2 */}
      <View style={styles.grid}>
        <StatCard label="今月見込みマージン" value={jpy(homeKpis.estimatedMarginJpy)} sub={`▲ ${jpy(homeKpis.estimatedMarginDeltaJpy)}`} subTone="emerald" style={styles.gridItem} />
        <StatCard label="累計マージン"       value={jpy(homeKpis.cumulativeMarginJpy)} sub="2026年度" style={styles.gridItem} />
        <StatCard label="担当店舗" value={`${homeKpis.customerCount}店`} sub={`好調 ${homeKpis.customersGood} / 要フォロー ${homeKpis.customersFollow}`} style={styles.gridItem} />
        <StatCard label="今月の新規受注" value={`${homeKpis.newOrdersCount}件`} sub={`▲ ${homeKpis.newOrdersDelta} 件`} subTone="emerald" style={styles.gridItem} />
      </View>

      {/* 今日やること */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>今日やること</Text>
          <Text style={styles.cardCount}>{todayTodos.length}件</Text>
        </View>
        {todayTodos.map((t) => (
          <Pressable key={t.id} style={styles.todoRow}
            onPress={() => {
              if (t.link === 'customers')    router.push('/(tabs)/customers');
              else if (t.link === 'products') router.push('/(tabs)/products');
              else if (t.link === 'showroom') router.push('/showroom');
            }}>
            <View style={[styles.dot, { backgroundColor:
              t.color === 'red' ? Accent.red : t.color === 'amber' ? Accent.amber : Accent.emerald }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.todoTitle}>{t.title}</Text>
              <Text style={styles.todoSub}>{t.sub}</Text>
            </View>
            <Text style={styles.todoLink}>開く →</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footerCredit}>MARUI BUSSAN × RANGER</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { fontSize: 11, color: Ink[500], letterSpacing: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  name: { fontSize: 18, fontWeight: '700', color: Ink[900] },
  rankPill: { backgroundColor: 'rgba(30,58,95,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  rankText: { fontSize: 10, color: Brand.navy, fontWeight: '700' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Brand.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },

  hero: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.xl,
    padding: 24,
    marginBottom: 12,
    shadowColor: Brand.navyDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  heroValue: { color: '#fff', fontSize: 44, fontWeight: '800', marginTop: 6, letterSpacing: -1 },
  heroRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  heroGrowth: { color: Accent.emeraldLight, fontSize: 13, fontWeight: '600' },
  heroPrev: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  goalPct: { color: '#fff', fontSize: 12, fontWeight: '700' },
  goalRemaining: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 8 },
  goalRemainingStrong: { color: '#fff', fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  gridItem: { width: '48%', flexGrow: 1 },

  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Ink[100],
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Ink[900] },
  cardCount: { fontSize: 12, color: Ink[500] },
  todoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  todoTitle: { fontSize: 13, color: Ink[900], fontWeight: '500' },
  todoSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  todoLink: { fontSize: 11, color: Brand.navy, fontWeight: '600' },

  footerCredit: { textAlign: 'center', color: Ink[500], fontSize: 10, letterSpacing: 2, marginTop: 8 },
});
