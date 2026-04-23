import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ranger/ProgressBar';
import { Screen } from '@/components/ranger/Screen';
import { StatCard } from '@/components/ranger/StatCard';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { rankLabel, roleLabel } from '@/constants/labels';
import { useAdminOverview } from '@/hooks/use-admin-overview';
import { useAuth } from '@/hooks/use-auth';
import { useCustomers, deriveStatus } from '@/hooks/use-customers';
import { useHomeKpis } from '@/hooks/use-home-kpis';
import { useProfile } from '@/hooks/use-profile';
import { useTodayTasks } from '@/hooks/use-today-tasks';
import { jpy, pct } from '@/lib/format';
import { homeKpis, rangerProfile } from '@/lib/mockData';

const RANK_COLOR: Record<string, string> = {
  platinum: '#8B7FB3',
  gold: Brand.gold,
  silver: '#9CA3AF',
  bronze: '#B8764A',
};

function AdminDashboard({ displayName, avatarInitial }: { displayName: string; avatarInitial: string }) {
  const { overview, loading } = useAdminOverview();

  if (loading || !overview) {
    return (
      <Screen>
        <View style={styles.loadingBox}>
          <Text style={styles.greeting}>読み込み中...</Text>
        </View>
      </Screen>
    );
  }

  const remainingToGoal = Math.max(0, overview.totalGoalJpy - overview.thisMonthSalesJpy);

  return (
    <Screen>
      {/* ヘッダー（admin 用） */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>おはようございます</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.rankPill}>
              <Text style={styles.rankText}>管理者</Text>
            </View>
          </View>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarInitial}</Text>
        </View>
      </View>

      {/* ① 全社業績ヒーロー */}
      <View style={styles.adminHero}>
        <Text style={styles.heroLabel}>今月の全社売上</Text>
        <Text style={styles.heroValue}>{jpy(overview.thisMonthSalesJpy)}</Text>
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroPrev}>目標 {jpy(overview.totalGoalJpy)}</Text>
          <Text style={styles.heroGrowth}>達成率 {pct(overview.goalProgressPct)}</Text>
        </View>
        <View style={{ marginTop: 8 }}>
          <ProgressBar progress={overview.goalProgressPct} height={8} />
        </View>
        <Text style={styles.goalRemaining}>
          目標まであと <Text style={styles.goalRemainingStrong}>{jpy(remainingToGoal)}</Text>
        </Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroBottomRow}>
          <View>
            <Text style={styles.heroBottomLabel}>着地予想</Text>
            <Text style={styles.heroBottomValue}>{jpy(overview.projectedMonthEndJpy)}</Text>
          </View>
          <View>
            <Text style={styles.heroBottomLabel}>受注</Text>
            <Text style={styles.heroBottomValue}>{overview.thisMonthOrderCount}件</Text>
          </View>
          <View>
            <Text style={styles.heroBottomLabel}>レンジャー</Text>
            <Text style={styles.heroBottomValue}>{overview.totalRangers}名</Text>
          </View>
        </View>
      </View>

      {/* ② アラート */}
      <View style={styles.alertRow}>
        <View style={[styles.alertCard, overview.followRequiredCount > 0 && styles.alertCardWarn]}>
          <Text style={styles.alertLabel}>🚨 要フォロー</Text>
          <Text style={[styles.alertValue, overview.followRequiredCount > 0 && { color: Accent.red }]}>
            {overview.followRequiredCount}
            <Text style={styles.alertUnit}>店</Text>
          </Text>
          <Text style={styles.alertSub}>30日以上未発注</Text>
        </View>
        <View style={styles.alertCard}>
          <Text style={styles.alertLabel}>🆕 今月加入レンジャー</Text>
          <Text style={[styles.alertValue, { color: Accent.emerald }]}>
            {overview.newRangerThisMonthCount}
            <Text style={styles.alertUnit}>名</Text>
          </Text>
          <Text style={styles.alertSub}>加入日ベース</Text>
        </View>
      </View>

      {/* 顧客 新規指標 2種 */}
      <View style={styles.alertRow}>
        <View style={styles.alertCard}>
          <Text style={styles.alertLabel}>📝 今月の登録</Text>
          <Text style={[styles.alertValue, { color: Ink[900] }]}>
            {overview.newCustomerRegisteredCount}
            <Text style={styles.alertUnit}>店</Text>
          </Text>
          <Text style={styles.alertSub}>システム登録日ベース</Text>
        </View>
        <View style={[styles.alertCard, overview.newCustomerFirstOrderCount > 0 && { borderColor: 'rgba(16,185,129,0.4)', borderWidth: 2 }]}>
          <Text style={styles.alertLabel}>🎯 今月の初回受注</Text>
          <Text style={[styles.alertValue, { color: Accent.emerald }]}>
            {overview.newCustomerFirstOrderCount}
            <Text style={styles.alertUnit}>店</Text>
          </Text>
          <Text style={styles.alertSub}>実質の新規獲得</Text>
        </View>
      </View>

      {/* ③ 財務 */}
      <View style={styles.grid}>
        <StatCard
          label="未払報酬"
          value={jpy(overview.totalCommissionPending)}
          sub="未確定・確定合計"
          subTone="amber"
          style={styles.gridItem}
        />
        <StatCard
          label="支払済"
          value={jpy(overview.totalCommissionPaid)}
          sub="支払済合計"
          style={styles.gridItem}
        />
      </View>

      {/* ④ レンジャー別 上位3名 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>レンジャー別 今月売上 上位3名</Text>
          <Pressable onPress={() => router.push('/(tabs)/rangers')}>
            <Text style={styles.cardLink}>全員見る →</Text>
          </Pressable>
        </View>
        {overview.rangers.slice(0, 3).map((r, i) => (
          <View key={r.ranger_id} style={styles.rangerRow}>
            <Text style={[styles.rangerRank, { color: Brand.gold }]}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rangerName}>{r.display_name}</Text>
              <View style={[styles.rankPillSmall, { backgroundColor: RANK_COLOR[r.current_rank] ?? Ink[300] }]}>
                <Text style={styles.rankPillSmallText}>{rankLabel(r.current_rank)}</Text>
              </View>
            </View>
            <Text style={styles.rangerSales}>{jpy(r.sales_jpy)}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { kpis } = useHomeKpis(session);
  const { customers } = useCustomers();
  const { tasks: allTasks } = useTodayTasks(session);
  // 要フォロー・ショールームは優先して全件、残り枠を推薦で埋める（合計最大4件）
  const followTasks = allTasks.filter((t) => t.task_type === 'follow');
  const showroomTasks = allTasks.filter((t) => t.task_type === 'showroom');
  const recommendTasks = allTasks.filter((t) => t.task_type === 'recommend');
  const remain = Math.max(0, 4 - followTasks.length - showroomTasks.length);
  const todayTasks = [...followTasks, ...showroomTasks, ...recommendTasks.slice(0, remain)];

  const displayName = profile?.display_name ?? rangerProfile.name;
  const avatarInitial = displayName.charAt(0);
  const role = profile?.role ?? rangerProfile.rank;

  // 管理者は専用ビューを表示
  if (profile?.role === 'admin') {
    return <AdminDashboard displayName={displayName} avatarInitial={avatarInitial} />;
  }

  // Supabase 由来の数値がある場合はそちらを優先、無ければ mockData で埋める
  const k = {
    ...homeKpis,
    ...(kpis ?? {}),
  };
  const customerCount = customers.length || k.customerCount;
  const customersGood = customers.length
    ? customers.filter((c) => deriveStatus(c.last_ordered_at) === 'good').length
    : k.customersGood;
  const customersFollow = customers.length
    ? customers.filter((c) => deriveStatus(c.last_ordered_at) === 'follow').length
    : k.customersFollow;

  return (
    <Screen>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>おはようございます</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.rankPill}><Text style={styles.rankText}>{roleLabel(role)}</Text></View>
          </View>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{avatarInitial}</Text></View>
      </View>

      {/* ヒーロー：今月売上 */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>今月の売上</Text>
        <Text style={styles.heroValue}>{jpy(k.monthSalesJpy)}</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroGrowth}>▲ {pct(k.monthGrowthPct)}</Text>
          <Text style={styles.heroPrev}>前月比 {jpy(k.prevMonthSalesJpy)}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>今月の目標</Text>
          <Text style={styles.goalPct}>{pct(k.goalProgressPct)}</Text>
        </View>
        <ProgressBar progress={k.goalProgressPct} height={8} />
        <Text style={styles.goalRemaining}>
          あと <Text style={styles.goalRemainingStrong}>{jpy(k.remainingToGoalJpy)}</Text> で達成
        </Text>
      </View>

      {/* KPIカード 2x2 */}
      <View style={styles.grid}>
        <StatCard label="今月見込みマージン" value={jpy(k.estimatedMarginJpy)} sub={`▲ ${jpy(k.estimatedMarginDeltaJpy)}`} subTone="emerald" style={styles.gridItem} />
        <StatCard label="累計マージン"       value={jpy(k.cumulativeMarginJpy)} sub="2026年度" style={styles.gridItem} />
        <StatCard label="担当店舗" value={`${customerCount}店`} sub={`好調 ${customersGood} / 要フォロー ${customersFollow}`} style={styles.gridItem} />
        <StatCard label="今月の新規受注" value={`${k.newOrdersCount}件`} sub={`▲ ${k.newOrdersDelta} 件`} subTone="emerald" style={styles.gridItem} />
      </View>

      {/* 今日やること（v_today_tasks から動的生成） */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>今日やること</Text>
          <Text style={styles.cardCount}>{todayTasks.length}件</Text>
        </View>
        {todayTasks.length === 0 ? (
          <Text style={styles.todoEmpty}>やることは特にありません</Text>
        ) : (
          todayTasks.map((t) => (
            <Pressable
              key={t.entity_id}
              style={styles.todoRow}
              onPress={() => {
                if (t.link === 'customers') router.push('/(tabs)/customers');
                else if (t.link === 'products') router.push('/(tabs)/products');
                else if (t.link === 'showroom') router.push('/showroom');
              }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      t.color === 'red' ? Accent.red : t.color === 'amber' ? Accent.amber : Accent.emerald,
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.todoTitle}>{t.title}</Text>
                <Text style={styles.todoSub}>{t.sub}</Text>
              </View>
              <Text style={styles.todoLink}>開く →</Text>
            </Pressable>
          ))
        )}
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
  todoEmpty: { fontSize: 12, color: Ink[500], paddingVertical: 12, textAlign: 'center' },

  footerCredit: { textAlign: 'center', color: Ink[500], fontSize: 10, letterSpacing: 2, marginTop: 8 },

  loadingBox: { paddingVertical: 48, alignItems: 'center' },

  adminHero: {
    backgroundColor: Brand.navy,
    borderRadius: Radius.xl,
    padding: 22,
    marginBottom: 12,
  },
  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  heroBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroBottomLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: 1 },
  heroBottomValue: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 4 },

  alertRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  alertCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Ink[100],
  },
  alertCardWarn: { borderColor: 'rgba(239,68,68,0.4)', borderWidth: 2 },
  alertLabel: { fontSize: 10, color: Ink[500], letterSpacing: 0.5 },
  alertValue: { fontSize: 22, fontWeight: '800', color: Ink[900], marginTop: 4 },
  alertUnit: { fontSize: 11, fontWeight: '500', color: Ink[500] },
  alertSub: { fontSize: 10, color: Ink[500], marginTop: 4 },

  cardLink: { fontSize: 11, color: Brand.navy, fontWeight: '700' },
  rangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  rangerRank: { width: 28, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  rangerName: { fontSize: 13, fontWeight: '700', color: Ink[900] },
  rankPillSmall: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, marginTop: 4 },
  rankPillSmallText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  rangerSales: { fontSize: 13, fontWeight: '700', color: Ink[900] },
});
