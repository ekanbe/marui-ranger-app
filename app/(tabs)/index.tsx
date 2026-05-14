import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useAdminOverview } from '@/hooks/use-admin-overview';
import { useAuth } from '@/hooks/use-auth';
import { useCommissions } from '@/hooks/use-commissions';
import { deriveStatus, useCustomers } from '@/hooks/use-customers';
import { useDormantCustomers } from '@/hooks/use-dormant-customers';
import { useHomeKpis } from '@/hooks/use-home-kpis';
import { useMyRanger } from '@/hooks/use-my-ranger';
import { useProfile } from '@/hooks/use-profile';
import { useRanking } from '@/hooks/use-ranking';
import { useTodayTasks } from '@/hooks/use-today-tasks';
import { jpy, pct } from '@/lib/format';
import { homeKpis, rangerProfile } from '@/lib/mockData';
import { SALES_PHASES } from '@/lib/sales-phase';

// ============================================================
// Admin Dashboard
// ============================================================
function AdminDashboard({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string | null }) {
  const { overview, loading } = useAdminOverview();
  const { summary: dormancy } = useDormantCustomers({ rangerId: null, isAdmin: true });

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
      <HeaderBar displayName={displayName} avatarUrl={avatarUrl} roleLabel="管理者" />

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

      {/* 承認待ちアラート（最優先） */}
      {overview.pendingApprovalCount > 0 ? (
        <Pressable onPress={() => router.push('/approvals')} style={styles.approvalAlert}>
          <View style={{ flex: 1 }}>
            <Text style={styles.approvalTitle}>🔔 承認待ちの受注</Text>
            <Text style={styles.approvalSub}>入金確認後に承認してください</Text>
          </View>
          <View style={styles.approvalCountBox}>
            <Text style={styles.approvalCount}>{overview.pendingApprovalCount}</Text>
            <Text style={styles.approvalUnit}>件</Text>
          </View>
          <Text style={styles.approvalArrow}>›</Text>
        </Pressable>
      ) : null}

      {/* EC同期管理（管理者エントリ） */}
      <Pressable onPress={() => router.push('/admin-ec-sync')} style={styles.ecSyncRow}>
        <View style={styles.ecSyncIconBox}>
          <Text style={styles.ecSyncIcon}>🔗</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ecSyncTitle}>EC同期管理</Text>
          <Text style={styles.ecSyncSub}>foodboat.jp 連携 ／ 未マッチ注文の紐付け</Text>
        </View>
        <Text style={styles.ecSyncArrow}>›</Text>
      </Pressable>

      {/* Bカート同期管理（管理者エントリ） */}
      <Pressable onPress={() => router.push('/admin-bcart-sync' as any)} style={styles.ecSyncRow}>
        <View style={styles.ecSyncIconBox}>
          <Text style={styles.ecSyncIcon}>🏢</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ecSyncTitle}>Bカート同期管理</Text>
          <Text style={styles.ecSyncSub}>直接取引EC連携 ／ 未マッチ受注の紐付け</Text>
        </View>
        <Text style={styles.ecSyncArrow}>›</Text>
      </Pressable>

      {/* ショールーム予約管理（管理者エントリ） */}
      <Pressable onPress={() => router.push('/admin-showroom')} style={styles.ecSyncRow}>
        <View style={styles.ecSyncIconBox}>
          <Text style={styles.ecSyncIcon}>🏬</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ecSyncTitle}>ショールーム予約管理</Text>
          <Text style={styles.ecSyncSub}>LINE予約連携 ／ 未マッチの紐付け ／ 来場ステータス管理</Text>
        </View>
        <Text style={styles.ecSyncArrow}>›</Text>
      </Pressable>

      {/* 獲得顧客のフェーズ別件数（全社） */}
      {overview.totalAcquired > 0 ? (
        <>
          <SectionTitle
            title="獲得顧客のフェーズ"
            caption={`全社 ${overview.totalAcquired} 件`}
            action="顧客一覧 →"
            onAction={() => router.push('/(tabs)/customers')}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.phaseStatsRow}
            style={{ marginBottom: 18 }}
          >
            {overview.phaseCounts.map((p) => (
              <Pressable
                key={p.key}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/customers', params: { phase: p.key } })
                }
                style={({ pressed }) => [
                  styles.phaseStatCard,
                  p.count === 0 && styles.phaseStatCardEmpty,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.phaseStatCount, p.count === 0 && styles.phaseStatCountEmpty]}>
                  {p.count}
                </Text>
                <Text style={styles.phaseStatLabel}>{p.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

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

      {/* 取引断絶検知（DEVICE A）— 3段階 */}
      {dormancy.total > 0 ? (
        <>
          <SectionTitle
            title="🚨 取引断絶検知"
            caption={`全社 ${dormancy.total} 社が要フォロー`}
            style={{ marginTop: 10 }}
          />
          <View style={styles.row3}>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(tabs)/customers', params: { dormancy: 'warning' } })
              }
              style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.7 }]}
            >
              <KpiCard
                label="🟡 30日〜"
                value={`${dormancy.warning}`}
                unit="社"
                tone={dormancy.warning > 0 ? 'amber' : 'ink'}
                delta="黄信号"
              />
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(tabs)/customers', params: { dormancy: 'danger' } })
              }
              style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.7 }]}
            >
              <KpiCard
                label="🟠 60日〜"
                value={`${dormancy.danger}`}
                unit="社"
                tone={dormancy.danger > 0 ? 'amber' : 'ink'}
                delta="オレンジ"
              />
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(tabs)/customers', params: { dormancy: 'critical' } })
              }
              style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.7 }]}
            >
              <KpiCard
                label="🔴 90日〜"
                value={`${dormancy.critical}`}
                unit="社"
                tone={dormancy.critical > 0 ? 'red' : 'ink'}
                delta="赤信号"
              />
            </Pressable>
          </View>
        </>
      ) : null}

      {/* 新規指標 */}
      <View style={styles.row2}>
        <KpiCard
          label="📝 今月の登録"
          value={`${overview.newCustomerRegisteredCount}`}
          unit="店"
          tone="ink"
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

      {/* レンジャー月間ランキング（全員） */}
      <SectionTitle
        title="月間ランキング"
        caption={`登録 ${overview.rangers.length} 名（うち稼働 ${overview.rangers.filter((r) => r.is_active_this_month).length} 名）`}
        action="詳細 →"
        onAction={() => router.push('/(tabs)/rangers')}
      />
      <Card variant="surface" padding={0} style={{ overflow: 'hidden' }}>
        {overview.rangers.map((r, i) => {
          const medal = !r.is_active_this_month
            ? '—'
            : i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
          return (
            <Pressable
              key={r.ranger_id}
              onPress={() => router.push({ pathname: '/ranger/[id]', params: { id: r.ranger_id } })}
              style={[
                styles.rangerRow,
                !r.is_active_this_month && { opacity: 0.6 },
                i === overview.rangers.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={[styles.trophy, rankBadgeStyle(i, r.is_active_this_month)]}>
                <Text style={[styles.trophyText, rankBadgeTextStyle(i, r.is_active_this_month)]}>
                  {medal}
                </Text>
              </View>
              <Avatar name={r.display_name} imageUrl={r.avatar_url} size="sm" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.rangerNumber}>レンジャー{r.ranger_number}号</Text>
                <Text style={styles.rangerName}>{r.display_name}</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                  <Badge label={rankLabel(r.current_rank)} tone={r.current_rank as any} />
                  {!r.is_active_this_month ? <Badge label="今月未稼働" tone="amber" /> : null}
                </View>
              </View>
              <Text style={styles.rangerSales}>{jpy(r.sales_jpy)}</Text>
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}

function rankBadgeStyle(i: number, isActive = true) {
  if (!isActive) return { backgroundColor: 'rgba(156,163,175,0.10)' };
  if (i === 0) return { backgroundColor: 'rgba(245,158,11,0.14)' };
  if (i === 1) return { backgroundColor: 'rgba(156,163,175,0.14)' };
  if (i === 2) return { backgroundColor: 'rgba(184,118,74,0.14)' };
  return { backgroundColor: 'rgba(30,58,95,0.06)' };
}
function rankBadgeTextStyle(i: number, isActive = true) {
  if (!isActive) return { color: '#9CA3AF', fontSize: 12 };
  if (i === 0) return { color: '#B45309' };
  if (i === 1) return { color: '#4B5563' };
  if (i === 2) return { color: '#92400E' };
  return { color: '#1E3A5F' };
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
  avatarUrl,
  roleLabel,
}: {
  displayName: string;
  avatarUrl?: string | null;
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
      <Pressable onPress={() => router.push('/profile-edit')}>
        <Avatar name={displayName} imageUrl={avatarUrl} size="md" />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { kpis } = useHomeKpis(session);
  const { customers } = useCustomers();
  const { tasks: allTasks } = useTodayTasks(session);
  const { ranger: myRanger } = useMyRanger(session);
  const { rows: commissions } = useCommissions(session);
  const { rows: rankingRows } = useRanking(session);
  const { summary: dormancy } = useDormantCustomers({
    rangerId: session?.user.id ?? null,
    isAdmin: false,
  });

  const followTasks = allTasks.filter((t) => t.task_type === 'follow');
  const showroomTasks = allTasks.filter((t) => t.task_type === 'showroom');
  const recommendTasks = allTasks.filter((t) => t.task_type === 'recommend');
  const remain = Math.max(0, 4 - followTasks.length - showroomTasks.length);
  const todayTasks = [...followTasks, ...showroomTasks, ...recommendTasks.slice(0, remain)];

  const displayName = profile?.display_name ?? rangerProfile.name;
  const avatarUrl = profile?.avatar_url;
  const role = profile?.role ?? rangerProfile.rank;

  // 管理ダッシュボードは Web 限定
  if (profile?.role === 'admin' && Platform.OS === 'web') {
    return <AdminDashboard displayName={displayName} avatarUrl={avatarUrl} />;
  }

  const k = { ...homeKpis, ...(kpis ?? {}) };
  const customerCount = customers.length || k.customerCount;
  const customersGood = customers.length
    ? customers.filter((c) => deriveStatus(c.last_ordered_at) === 'good').length
    : k.customersGood;
  const customersFollow = customers.length
    ? customers.filter((c) => deriveStatus(c.last_ordered_at) === 'follow').length
    : k.customersFollow;

  // ── 営業フェーズ集計（レンジャー獲得顧客のみ）──
  const acquiredCustomers = customers.filter((c) => c.acquired_by_ranger_id);
  const phaseCounts = SALES_PHASES.map((p) => ({
    key: p.key,
    label: p.label,
    count: acquiredCustomers.filter((c) => c.sales_phase === p.key).length,
  }));
  const totalAcquired = acquiredCustomers.length;

  // ── EC継続収入：source=ec の commissions から算出 ──
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ecCommissions = commissions.filter((c) => c.source === 'ec');
  const ecThisMonthJpy = ecCommissions
    .filter((c) => new Date(c.ordered_at) >= monthStart && c.status !== 'paid')
    .reduce((s, c) => s + c.ranger_amount_jpy, 0);
  const ecThisMonthCount = ecCommissions.filter(
    (c) => new Date(c.ordered_at) >= monthStart
  ).length;
  const ecCustomerCount = new Set(ecCommissions.map((c) => c.customer_name).filter(Boolean)).size;

  // ── 直接取引（Bカート）：source=bcart の commissions から算出 ──
  const bcartCommissions = commissions.filter((c) => c.source === 'bcart');
  const bcartThisMonthJpy = bcartCommissions
    .filter((c) => new Date(c.ordered_at) >= monthStart && c.status !== 'paid')
    .reduce((s, c) => s + c.ranger_amount_jpy, 0);
  const bcartThisMonthCount = bcartCommissions.filter(
    (c) => new Date(c.ordered_at) >= monthStart
  ).length;
  const bcartCustomerCount = new Set(bcartCommissions.map((c) => c.customer_name).filter(Boolean)).size;

  return (
    <Screen>
      <HeaderBar
        displayName={displayName}
        avatarUrl={avatarUrl}
        roleLabel={
          role === 'ranger' && myRanger?.ranger_number
            ? `レンジャー${myRanger.ranger_number}号`
            : roleLabel(role)
        }
      />

      {/* 今月の売上ヒーロー */}
      <HeroCard label="今月の売上" value={jpy(k.monthSalesJpy)} tone="navy" style={{ marginBottom: 14 }}>
        <View style={styles.heroRow}>
          <Text style={styles.heroGrowth}>
            {k.monthGrowthPct >= 0 ? '↑' : '↓'} {pct(Math.abs(k.monthGrowthPct))}
          </Text>
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
          iconSource={require('@/assets/icons/action-new-order.png')}
          dotColor={Accent.emerald}
          onPress={() => router.push('/(tabs)/customers')}
        />
        <QuickAction
          label="顧客追加"
          iconSource={require('@/assets/icons/action-add-customer.png')}
          dotColor={Brand.navy}
          onPress={() => router.push('/customer-new')}
        />
        <QuickAction
          label="ショールーム"
          iconSource={require('@/assets/icons/action-showroom.png')}
          dotColor={Brand.gold}
          onPress={() => router.push('/showroom')}
        />
        <QuickAction
          label="ランキング"
          iconSource={require('@/assets/icons/action-ranking.png')}
          dotColor={Accent.amber}
          onPress={() => router.push('/ranking')}
        />
      </ScrollView>

      {/* 取引断絶検知（DEVICE A）— 警告がある時のみ表示 */}
      {dormancy.total > 0 ? (
        <Pressable
          onPress={() =>
            router.push({ pathname: '/(tabs)/customers', params: { dormancy: 'all' } })
          }
          style={({ pressed }) => [styles.dormantBanner, pressed && { opacity: 0.85 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dormantTitle}>🚨 要フォローの担当顧客</Text>
            <Text style={styles.dormantSub}>
              {dormancy.warning > 0 ? `🟡 ${dormancy.warning}社 ` : ''}
              {dormancy.danger > 0 ? `🟠 ${dormancy.danger}社 ` : ''}
              {dormancy.critical > 0 ? `🔴 ${dormancy.critical}社` : ''}
            </Text>
          </View>
          <View style={styles.dormantCountBox}>
            <Text style={styles.dormantCount}>{dormancy.total}</Text>
            <Text style={styles.dormantUnit}>社</Text>
          </View>
          <Text style={styles.dormantArrow}>›</Text>
        </Pressable>
      ) : null}

      {/* KPI 2x2 */}
      <View style={styles.grid}>
        <KpiCard
          label="今月の見込みマージン"
          value={jpy(k.estimatedMarginJpy)}
          tone="emerald"
          trend={k.estimatedMarginDeltaJpy >= 0 ? 'up' : 'down'}
          delta={`${jpy(Math.abs(k.estimatedMarginDeltaJpy))} 前月比`}
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
          tone="ink"
          delta={`好調 ${customersGood} / 要フォロー ${customersFollow}`}
          style={styles.gridItem}
        />
        <KpiCard
          label="今月の新規受注"
          value={`${k.newOrdersCount}`}
          unit="件"
          tone="emerald"
          trend={k.newOrdersDelta >= 0 ? 'up' : 'down'}
          delta={`${Math.abs(k.newOrdersDelta)} 件 前月比`}
          style={styles.gridItem}
        />
      </View>

      {/* 獲得顧客のフェーズ別件数（レンジャー獲得顧客がある時のみ） */}
      {totalAcquired > 0 ? (
        <>
          <SectionTitle title="獲得顧客のフェーズ" caption={`${totalAcquired} 名`} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.phaseStatsRow}
            style={{ marginBottom: 18 }}
          >
            {phaseCounts.map((p) => (
              <Pressable
                key={p.key}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/customers', params: { phase: p.key } })
                }
                style={({ pressed }) => [
                  styles.phaseStatCard,
                  p.count === 0 && styles.phaseStatCardEmpty,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.phaseStatCount, p.count === 0 && styles.phaseStatCountEmpty]}>
                  {p.count}
                </Text>
                <Text style={styles.phaseStatLabel}>{p.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* EC継続収入カード（source=ec の commissions 集計） */}
      {ecCommissions.length > 0 ? (
        <Pressable
          onPress={() => router.push('/(tabs)/margin')}
          style={styles.ecIncomeCard}
        >
          <View style={styles.ecIncomeLeft}>
            <View style={styles.ecIncomeBadge}>
              <Text style={styles.ecIncomeBadgeText}>EC継続</Text>
            </View>
            <Text style={styles.ecIncomeLabel}>foodboat.jp からの自動収入</Text>
            <Text style={styles.ecIncomeValue}>{jpy(ecThisMonthJpy)}</Text>
            <Text style={styles.ecIncomeSub}>
              今月 {ecThisMonthCount} 件 ／ {ecCustomerCount} 人の顧客
            </Text>
          </View>
          <View style={styles.ecIncomeRight}>
            <Text style={styles.ecIncomeEmoji}>🔗</Text>
            <Text style={styles.ecIncomeHint}>
              紐付けた顧客が{'\n'}買うたびに自動計上
            </Text>
          </View>
          <Text style={styles.ecIncomeArrow}>›</Text>
        </Pressable>
      ) : null}

      {/* Bカート直接取引カード（source=bcart の commissions 集計） */}
      {bcartCommissions.length > 0 ? (
        <Pressable
          onPress={() => router.push('/(tabs)/margin')}
          style={styles.bcartIncomeCard}
        >
          <View style={styles.ecIncomeLeft}>
            <View style={styles.bcartIncomeBadge}>
              <Text style={styles.bcartIncomeBadgeText}>直接取引</Text>
            </View>
            <Text style={styles.ecIncomeLabel}>Bカート 経由のBtoB受注</Text>
            <Text style={styles.bcartIncomeValue}>{jpy(bcartThisMonthJpy)}</Text>
            <Text style={styles.ecIncomeSub}>
              今月 {bcartThisMonthCount} 件 ／ {bcartCustomerCount} 社の顧客
            </Text>
          </View>
          <View style={styles.ecIncomeRight}>
            <Text style={styles.ecIncomeEmoji}>🏢</Text>
            <Text style={styles.ecIncomeHint}>
              見積→発注の{'\n'}自動同期
            </Text>
          </View>
          <Text style={styles.bcartIncomeArrow}>›</Text>
        </Pressable>
      ) : null}

      {/* 月間ランキング（TOP5 + 圏外なら自分） */}
      {rankingRows.length > 0 ? (
        <>
          <SectionTitle
            title="月間ランキング"
            caption={`全 ${rankingRows.length} 名`}
            action="すべて見る →"
            onAction={() => router.push('/ranking')}
          />
          <Card variant="surface" padding={0} style={{ overflow: 'hidden', marginBottom: 14 }}>
            {(() => {
              const top5 = rankingRows.slice(0, 5);
              const myRow = rankingRows.find((r) => r.isMe);
              const inTop5 = top5.some((r) => r.isMe);
              const display = inTop5 || !myRow ? top5 : [...top5, myRow];
              return display.map((r, i) => {
                const isInactive = r.sales_jpy === 0;
                const medal = isInactive
                  ? '—'
                  : r.rank === 1 ? '🥇'
                  : r.rank === 2 ? '🥈'
                  : r.rank === 3 ? '🥉'
                  : `#${r.rank}`;
                const showDivider = !inTop5 && i === top5.length - 1 && myRow && !top5.some((tr) => tr.ranger_id === myRow.ranger_id);
                return (
                  <View key={r.ranger_id}>
                    <View
                      style={[
                        styles.rankItemHome,
                        r.isMe && styles.rankItemHomeMe,
                        isInactive && { opacity: 0.6 },
                      ]}
                    >
                      <Text style={[styles.rankMedalHome, !isInactive && r.rank <= 3 && { fontSize: 20 }]}>
                        {medal}
                      </Text>
                      <Avatar name={r.display_name} imageUrl={r.avatar_url} size="sm" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.rangerNumber}>レンジャー{r.ranger_number}号</Text>
                        <Text style={[styles.rangerName, r.isMe && { fontWeight: '900' }]}>
                          {r.display_name}{r.isMe ? '（あなた）' : ''}
                        </Text>
                      </View>
                      <Text style={styles.rangerSales}>{jpy(r.sales_jpy)}</Text>
                    </View>
                    {showDivider ? (
                      <View style={styles.rankSkip}>
                        <Text style={styles.rankSkipText}>⋯</Text>
                      </View>
                    ) : null}
                  </View>
                );
              });
            })()}
          </Card>
        </>
      ) : null}

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

      <View style={styles.footerRow}>
        <Image source={require('@/assets/images/icon.png')} style={styles.footerLogo} contentFit="cover" />
        <Text style={styles.footerCredit}>MARUI BUSSAN × RANGER</Text>
      </View>
    </Screen>
  );
}

function QuickAction({
  label,
  iconSource,
  dotColor,
  onPress,
}: {
  label: string;
  iconSource: number;
  dotColor: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.quickDot, { backgroundColor: dotColor }]} />
      <Image
        source={iconSource}
        style={styles.quickIcon}
        resizeMode="contain"
      />
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
    height: 96,
    borderRadius: Radius.md,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[100],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
    paddingBottom: 12,
    position: 'relative',
  },
  quickDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  quickIcon: { width: 36, height: 36 },
  quickLabel: { fontSize: 11, fontWeight: '800', color: Ink[900], letterSpacing: 0.5 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  gridItem: { width: '48%', flexGrow: 1 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  row3: { flexDirection: 'row', gap: 8, marginBottom: 10 },

  // 取引断絶検知バナー（ranger ホーム）
  dormantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(220,38,38,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.18)',
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 14,
  },
  dormantTitle: { fontSize: 13, fontWeight: '800', color: '#991B1B' },
  dormantSub: { fontSize: 11, color: '#7F1D1D', marginTop: 3 },
  dormantCountBox: { alignItems: 'flex-end' },
  dormantCount: { fontSize: 22, fontWeight: '900', color: '#991B1B' },
  dormantUnit: { fontSize: 10, color: '#991B1B' },
  dormantArrow: { fontSize: 18, color: '#991B1B', fontWeight: '700' },

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
  rangerNumber: { fontSize: 9, color: Ink[500], fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  rangerName: { fontSize: 13, fontWeight: '700', color: Ink[900], marginBottom: 4 },
  rangerSales: { fontSize: 14, fontWeight: '800', color: Ink[900] },

  approvalAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 12,
  },
  approvalTitle: { fontSize: 14, fontWeight: '800', color: '#B45309' },
  approvalSub: { fontSize: 11, color: Ink[600], marginTop: 2 },
  approvalCountBox: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  approvalCount: { fontSize: 24, fontWeight: '900', color: '#B45309' },
  approvalUnit: { fontSize: 12, fontWeight: '700', color: '#B45309' },
  approvalArrow: { fontSize: 22, color: '#B45309', fontWeight: '300' },

  ecSyncRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Ink[100],
  },

  // ランキング行（ホーム画面用）
  rankItemHome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Ink[100],
  },
  rankItemHomeMe: { backgroundColor: 'rgba(201,168,118,0.08)' },
  rankMedalHome: { width: 36, fontSize: 14, fontWeight: '800', color: Ink[700], textAlign: 'center' },
  rankSkip: { paddingVertical: 4, alignItems: 'center', backgroundColor: '#FAF7F0' },
  rankSkipText: { color: Ink[400], fontSize: 14, fontWeight: '800' },

  // レンジャー用：EC継続収入カード
  ecIncomeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Brand.navy,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(201,168,118,0.4)',
  },
  ecIncomeLeft: { flex: 1 },
  ecIncomeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(201,168,118,0.2)',
    borderColor: Brand.gold,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  ecIncomeBadgeText: { color: Brand.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  ecIncomeLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '600' },
  ecIncomeValue: { color: Brand.gold, fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: -0.3 },
  ecIncomeSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 4 },
  ecIncomeRight: { alignItems: 'center', gap: 4, opacity: 0.85 },
  ecIncomeEmoji: { fontSize: 28 },
  ecIncomeHint: { color: 'rgba(255,255,255,0.65)', fontSize: 10, textAlign: 'center', lineHeight: 14 },
  ecIncomeArrow: { color: Brand.gold, fontSize: 22, fontWeight: '300' },

  // レンジャー用：Bカート直接取引カード（ゴールド背景＋ネイビー強調で EC と差別化）
  bcartIncomeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F4ECD9',
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Brand.gold,
  },
  bcartIncomeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.navy,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  bcartIncomeBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  bcartIncomeValue: { color: Brand.navy, fontSize: 24, fontWeight: '900', marginTop: 2, letterSpacing: -0.3 },
  bcartIncomeArrow: { color: Brand.navy, fontSize: 22, fontWeight: '300' },
  ecSyncIconBox: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(30,58,95,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  ecSyncIcon: { fontSize: 18 },
  ecSyncTitle: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  ecSyncSub: { fontSize: 11, color: Ink[500], marginTop: 2 },
  ecSyncArrow: { fontSize: 22, color: Ink[300], fontWeight: '300' },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  footerLogo: { width: 18, height: 18, borderRadius: 4 },
  footerCredit: { textAlign: 'center', color: Ink[400], fontSize: 10, letterSpacing: 2 },

  phaseStatsRow: { gap: 8, paddingVertical: 4 },
  phaseStatCard: {
    width: 76,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Ink[100],
    alignItems: 'center',
  },
  phaseStatCardEmpty: { backgroundColor: 'rgba(0,0,0,0.02)' },
  phaseStatCount: { fontSize: 22, fontWeight: '800', color: Ink[900], letterSpacing: -0.5 },
  phaseStatCountEmpty: { color: Ink[300] },
  phaseStatLabel: { fontSize: 10, color: Ink[600], marginTop: 6, fontWeight: '700', letterSpacing: 0.3 },
});
