import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeroCard } from '@/components/ui/HeroCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerList } from '@/components/ui/Shimmer';
import { Ink, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { type ShowroomStatus, useShowroom } from '@/hooks/use-showroom';

const STATUS_LABEL: Record<ShowroomStatus, string> = {
  invited: '招待済',
  confirmed: '来場確定',
  visited: '来場済',
  cancelled: '中止',
};
const STATUS_TONE: Record<ShowroomStatus, 'amber' | 'navy' | 'emerald' | 'neutral'> = {
  invited: 'amber',
  confirmed: 'navy',
  visited: 'emerald',
  cancelled: 'neutral',
};

function fmt(ts: string | null, includeTime = true) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', weekday: 'short' } : {}),
  });
}

export default function ShowroomScreen() {
  const { session } = useAuth();
  const { items, loading } = useShowroom(session);

  const upcoming = items.filter((s) => s.status !== 'visited' && s.status !== 'cancelled');
  const past = items.filter((s) => s.status === 'visited');

  return (
    <Screen back>
      <Text style={styles.title}>ショールーム</Text>
      <Text style={styles.sub}>恵比寿・マルイ物産ショールーム</Text>

      <HeroCard
        label="今月の来場予定"
        value={`${upcoming.length}件`}
        tone="gold"
        sub="招待 → 来場 → 商談 → 受注 を一気通貫でトラッキング"
        style={{ marginBottom: 20 }}
      />

      {loading ? (
        <ShimmerList count={3} />
      ) : (
        <>
          <SectionTitle title="予定" caption={`${upcoming.length} 件`} />
          <View style={{ gap: 10, marginBottom: 20 }}>
            {upcoming.length === 0 ? (
              <EmptyState
                icon="📅"
                title="予定はありません"
                message="新規顧客をショールームに招待しましょう"
              />
            ) : (
              upcoming.map((s) => (
                <Card key={s.id} variant="surface" padding={16}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.name} numberOfLines={1}>{s.customer_name}</Text>
                    <Badge label={STATUS_LABEL[s.status]} tone={STATUS_TONE[s.status]} />
                  </View>
                  <Text style={styles.schedule}>📅 {fmt(s.scheduled_at)}</Text>
                  {s.memo ? <Text style={styles.memo}>{s.memo}</Text> : null}
                </Card>
              ))
            )}
          </View>

          <SectionTitle title="来場実績" caption={`${past.length} 件`} />
          <View style={{ gap: 10 }}>
            {past.length === 0 ? (
              <EmptyState icon="✨" title="来場実績はまだありません" />
            ) : (
              past.map((s) => (
                <View key={s.id} style={styles.cardVisited}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.name} numberOfLines={1}>{s.customer_name}</Text>
                    <Badge label="来場済" tone="emerald" />
                  </View>
                  <Text style={styles.schedule}>📅 {fmt(s.scheduled_at, false)}</Text>
                  {s.tasted_products.length > 0 ? (
                    <View style={styles.tastedRow}>
                      <Text style={styles.tastedLabel}>試食：</Text>
                      <Text style={styles.tastedValue}>{s.tasted_products.join('、')}</Text>
                    </View>
                  ) : null}
                  {s.memo ? <Text style={styles.memo}>{s.memo}</Text> : null}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, marginBottom: 16 },

  cardVisited: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  name: { fontSize: 14, fontWeight: '800', color: Ink[900], flex: 1 },
  schedule: { fontSize: 12, color: Ink[700], marginTop: 10, fontWeight: '600' },
  tastedRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  tastedLabel: { fontSize: 11, color: Ink[500], fontWeight: '700' },
  tastedValue: { fontSize: 11, color: Ink[900], fontWeight: '700' },
  memo: { fontSize: 11, color: Ink[500], marginTop: 8, lineHeight: 16 },
});
