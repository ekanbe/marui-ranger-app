import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeroCard } from '@/components/ui/HeroCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { ListRow } from '@/components/ui/ListRow';
import { Progress } from '@/components/ui/Progress';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { rankLabel, roleLabel } from '@/constants/labels';
import { Accent, Appetite, Brand, Ink, Radius } from '@/constants/theme';
import { useAdminOverview } from '@/hooks/use-admin-overview';
import { useAuth } from '@/hooks/use-auth';
import { deriveStatus, useCustomers } from '@/hooks/use-customers';
import { useHomeKpis } from '@/hooks/use-home-kpis';
import { useProfile } from '@/hooks/use-profile';
import { useTodayTasks } from '@/hooks/use-today-tasks';
import { jpy, pct } from '@/lib/format';
import { homeKpis, rangerProfile } from '@/lib/mockData';

// ============================================================
// Admin Dashboard
// ============================================================
function AdminDashboard({ displayName, avatarInitial }: { displayName: string; avatarInitial: string }) {
  const { overview, loading } = useAdminOverview();

  if (loading || !overview) {
    return (
      <Screen>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  const remainingToGoal = Math.max(0, overview.totalGoalJpy - overview.thisMonthSalesJpy);

  return (
    <Screen>
      <HeaderBar displayName={displayName} avatarInitial={avatarInitial} roleLabel="管理者" />

      {/* 全社売上ヒーロー */}
      <HeroCard
        label="今月の全社売上"
        value={jpy(overview.thisMonthSalesJpy)}
        tone="navy"
        style={{ marginBottom: 14 }}
      >
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroPrev}>目標 {jpy(overview.totalGoalJpy)}</Text>
          <Text style={styles.heroGrowth}>達成率 {pct(overview.goalProgressPct)}</Text>
        </View>
        <View style={{ marginTop: 10 }}>
          <Progress progress={overview.goalProgressPct} tone="gold" height={8} />
        </View>
        <Text style={styles.goalRemaining}>
          あと <Text style={styles.goalRemainingStrong}>{jpy(remainingToGoal)}</Text> で達成
        </Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroBottomRow}>
          <HeroStat label="着地予想" value={jpy(overview.projectedMonthEndJpy)} />
          <HeroStat label="受注" value={`${overview.thisMonthOrderCount}件`} />
          <HeroStat label="レンジャー" value={`${overview.totalRangers}名`} />
        </View>
      </HeroCard>

      {/* アラートカード 2枚 */}
      <View style={styles.row2}>
        <KpiCard
          label="🚨 要フォロー"
          value={`${overview.followRequiredCount}`}
          unit="店"
          tone={overview.followRequiredCount > 0 ? 'red' : 'ink'}
          delta="30日以上未発注"
          style={{ flex: 1 }}
        />
        <KpiCard
          label="🆕 今月加入レンジャー"
          value={`${overview.newRangerThisMonthCount}`}
          unit="名"
          tone="emerald"
          delta="加入日ベース"
          style={{ flex: 1 }}
        />
      </View>

      {/* 新規指標 */}
      <View style={styles.row2}>
        <KpiCard
          label="📝 今月の登録"
          value={`${overview.newCustomerRegisteredCount}`}
          unit="店"
          tone="navy"
          delta="システム登録日"
          style={{ flex: 1 }}
        />
        <KpiCard
          label="🎯 今月の初回受注"
          value={`${overview.newCustomerFirstOrderCount}`}
          unit="店"
          tone="emerald"
          delta="実質の新規獲得"
          style={{ flex: 1 }}
        />
      </View>

      {/* 財務 */}
      <View style={styles.row2}>
        <KpiCard
          label="未払報酬"
          value={jpy(overview.totalCommissionPending)}
          tone="amber"
          delta="未確定・確定合計"
          style={{ flex: 1 }}
        />
        <KpiCard
          label="支払済"
          value={jpy(overview.totalCommissionPaid)}
          tone="ink"
          delta="支払済合計"
          style={{ flex: 1 }}
        />
      </View>

      {/* レンジャー TOP3 */}
      <SectionTitle
        title="今月売上 TOP3"
        caption="全員を見る場合は「レンジャー」タブへ"
        action="すべて表示 →"
        onAction={() => router.push('/(tabs)/rangers')}
      />
      <Card variant="surface" padding={0} style={{ overflow: 'hidden' }}>
        {overview.rangers.slice(0, 3).map((r, i) => (
          <Pressable
            key={r.ranger_id}
            onPress={() => router.push({ pathname: '/ranger/[id]', params: { id: r.ranger_id } })}
            style={[
              styles.rangerRow,
              i === overview.rangers.slice(0, 3).length - 1 && { borderBottomWidth: 0 },
            ]}
          >
            <View style={[styles.trophy, rankBadgeStyle(i)]}>
              <Text style={[styles.trophyText, rankBadgeTextStyle(i)]}>{i + 1}</Text>
            </View>
            <Avatar name={r.display_name} size="sm" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.rangerName}>{r.display_name}</Text>
              <Badge label={rankLabel(r.current_rank)} tone={r.current_rank as any} />
            </View>
            <Text style={styles.rangerSales}>{jpy(r.sales_jpy)}</Text>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

function rankBadgeStyle(i: number) {
  if (i === 0) return { backgroundColor: 'rgba(245,158,11,0.14)' };
  if (i === 1) return { backgroundColor: 'rgba(156,163,175,0.14)' };
  return { backgroundColor: 'rgba(184,118,74,0.14)' };
}
function rankBadgeTextStyle(i: number) {
  if (i === 0) return { color: '#B45309' };
  if (i === 1) return { color: '#4B5563' };
  return { color: '#92400E' };
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.heroBottomLabel}>{label}</Text>
      <Text style={styles.heroBottomValue}>{value}</Text>
    </View>
  );
}

// ============================================================
// Ranger Home
// ============================================================
function HeaderBar({
  displayName,
  avatarInitial,
  roleLabel,
}: {
  displayName: string;
  avatarInitial: string;
  roleLabel: string;
}) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>おはようございます</Text>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{displayName}</Text>
          <Badge label={roleLabel} tone="navy" />
        </View>
      </View>
      <Avatar name={avatarInitial} size="md" />
    </View>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { kpis } = useHomeKpis(session);
  const { customers } = useCustomers();
  const { tasks: allTasks } = useTodayTasks(session);

  const followTasks = allTasks.filter((t) => t.task_type === 'follow');
  const showroomTasks = allTasks.filter((t) => t.task_type === 'showroom');
  const recommendTasks = allTasks.filter((t) => t.task_type === 'recommend');
  const remain = Math.max(0, 4 - followTasks.length - showroomTasks.length);
  const todayTasks = [...followTasks, ...showroomTasks, ...recommendTasks.slice(0, remain)];

  const displayName = profile?.display_name ?? rangerProfile.name;
  const avatarInitial = displayName.charAt(0);
  const role = profile?.role ?? rangerProfile.rank;

  if (profile?.role === 'admin') {
    return <AdminDashboard displayName={displayName} avatarInitial={avatarInitial} />;
  }

  const k = { ...homeKpis, ...(kpis ?? {}) };
  const customerCount = customers.length || k.customerCount;
  const customersGood = customers.length
    ? customers.filter((c) => deriveStatus(c.last_ordered_at) === 'good').length
    : k.customersGood;
  const customersFollow = customers.length
    ? customers.filter((c) => deriveStatus(c.last_ordered_at) === 'follow').length
    : k.customersFollow;

  return (
    <Screen>
      <HeaderBar displayName={displayName} avatarInitial={avatarInitial} roleLabel={roleLabel(role)} />

      {/* 今月の売上ヒーロー */}
      <HeroCard label="今月の売上" value={jpy(k.monthSalesJpy)} tone="navy" style={{ marginBottom: 14 }}>
        <View style={styles.heroRow}>
          <Text style={styles.heroGrowth}>▲ {pct(k.monthGrowthPct)}</Text>
          <Text style={styles.heroPrev}>前月 {jpy(k.prevMonthSalesJpy)}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>今月の目標</Text>
          <Text style={styles.goalPct}>{pct(k.goalProgressPct)}</Text>
        </View>
        <Progress progress={k.goalProgressPct} tone="gold" height={8} />
        <Text style={styles.goalRemaining}>
          あと <Text style={styles.goalRemainingStrong}>{jpy(k.remainingToGoalJpy)}</Text> で達成
        </Text>
      </HeroCard>

      {/* クイックアクション（横スクロールチップ） */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
        style={{ marginBottom: 14 }}
      >
        <QuickAction
          label="新規受注"
          icon="＋"
          tone="ember"
          onPress={() => router.push('/(tabs)/customers')}
        />
        <QuickAction
          label="顧客追加"
          icon="🏪"
          tone="navy"
          onPress={() => router.push('/customer-new')}
        />
        <QuickAction
          label="ショールーム"
          icon="✨"
          tone="gold"
          onPress={() => router.push('/showroom')}
        />
        <QuickAction
          label="ランキング"
          icon="🏆"
          tone="violet"
          onPress={() => router.push('/ranking')}
        />
      </ScrollView>

      {/* KPI 2x2 */}
      <View style={styles.grid}>
        <KpiCard
          label="今月の見込みマージン"
          value={jpy(k.estimatedMarginJpy)}
          tone="emerald"
          trend="up"
          delta={`▲ ${jpy(k.estimatedMarginDeltaJpy)}`}
          style={styles.gridItem}
        />
        <KpiCard
          label="累計マージン"
          value={jpy(k.cumulativeMarginJpy)}
          tone="ink"
          delta="2026年度"
          style={styles.gridItem}
        />
        <KpiCard
          label="担当店舗"
          value={`${customerCount}`}
          unit="店"
          tone="navy"
          delta={`好調 ${customersGood} / 要フォロー ${customersFollow}`}
          style={styles.gridItem}
        />
        <KpiCard
          label="今月の新規受注"
          value={`${k.newOrdersCount}`}
          unit="件"
          tone="ember"
          trend="up"
          delta={`▲ ${k.newOrdersDelta} 件`}
          style={styles.gridItem}
        />
      </View>

      {/* 今日やること */}
      <SectionTitle title="今日やること" caption={`${todayTasks.length} 件`} />
      {todayTasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title="本日は特にタスクなし"
          message="新規受注やフォロー予定はありません。ゆっくりコーヒーでもどうぞ。"
        />
      ) : (
        <View style={{ gap: 10 }}>
          {todayTasks.map((t) => (
            <ListRow
              key={t.entity_id}
              onPress={() => {
                if (t.link === 'customers') router.push('/(tabs)/customers');
                else if (t.link === 'products') router.push('/(tabs)/products');
                else if (t.link === 'showroom') router.push('/showroom');
              }}
              tone={t.color === 'red' ? 'warn' : 'default'}
              leading={
                <View
                  style={[
                    styles.taskIcon,
                    {
                      backgroundColor:
                        t.color === 'red'
                          ? 'rgba(239,68,68,0.12)'
                          : t.color === 'amber'
                            ? 'rgba(245,158,11,0.14)'
                            : 'rgba(16,185,129,0.12)',
                    },
                  ]}
                >
                  <Text style={styles.taskIconText}>
                    {t.task_type === 'follow' ? '📞' : t.task_type === 'showroom' ? '✨' : '💡'}
                  </Text>
                </View>
              }
              title={t.title}
              subtitle={t.sub}
              trailing={<Text style={styles.chevron}>›</Text>}
            />
          ))}
        </View>
      )}

      <Text style={styles.footerCredit}>MARUI BUSSAN × RANGER</Text>
    </Screen>
  );
}

function QuickAction({
  label,
  icon,
  tone,
  onPress,
}: {
  label: string;
  icon: string;
  tone: 'ember' | 'navy' | 'gold' | 'violet';
  onPress?: () => void;
}) {
  const bg =
    tone === 'ember' ? Appetite.ember :
    tone === 'navy' ? Brand.navy :
    tone === 'gold' ? Brand.gold :
    Accent.violet;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickCard, { backgroundColor: bg }, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greeting: { fontSize: 11, color: Ink[500], letterSpacing: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  name: { fontSize: 18, fontWeight: '800', color: Ink[900] },

  // Hero
  heroRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  heroGrowth: { color: Accent.emeraldLight, fontSize: 13, fontWeight: '700' },
  heroPrev: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
  heroMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  goalPct: { color: '#fff', fontSize: 13, fontWeight: '800' },
  goalRemaining: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 8 },
  goalRemainingStrong: { color: '#fff', fontWeight: '800' },
  heroBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroBottomLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, letterSpacing: 1 },
  heroBottomValue: { color: '#fff', fontSize: 14, fontWeight: '800', marginTop: 4 },

  // Quick actions
  quickRow: { gap: 10, paddingRight: 16 },
  quickCard: {
    width: 96,
    height: 84,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickIcon: { fontSize: 24, color: '#fff' },
  quickLabel: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  gridItem: { width: '48%', flexGrow: 1 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  // Today tasks
  taskIcon: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
  },
  taskIconText: { fontSize: 16 },
  chevron: { fontSize: 22, color: Ink[300], fontWeight: '300' },

  // Admin ranger rows
  rangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  trophy: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  trophyText: { fontSize: 13, fontWeight: '900' },
  rangerName: { fontSize: 13, fontWeight: '700', color: Ink[900], marginBottom: 4 },
  rangerSales: { fontSize: 14, fontWeight: '800', color: Ink[900] },

  footerCredit: { textAlign: 'center', color: Ink[400], fontSize: 10, letterSpacing: 2, marginTop: 16 },
});
