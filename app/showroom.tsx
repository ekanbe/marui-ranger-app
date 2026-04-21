import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { showroomInvites } from '@/lib/mockData';

const STATUS_LABEL = { invited: '招待済', confirmed: '来場確定', visited: '来場済' };
const STATUS_COLOR = { invited: Accent.amber, confirmed: Brand.navy, visited: Accent.emerald };

export default function ShowroomScreen() {
  const upcoming = showroomInvites.filter(s => s.status !== 'visited');
  const past = showroomInvites.filter(s => s.status === 'visited');

  return (
    <Screen>
      <Text style={styles.title}>ショールーム</Text>
      <Text style={styles.sub}>恵比寿・マルイ物産ショールーム</Text>

      {/* ヒーロー */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>今月の来場予定</Text>
        <Text style={styles.heroValue}>{upcoming.length}<Text style={styles.heroUnit}>件</Text></Text>
        <Text style={styles.heroSub}>招待 → 来場 → 商談 → 受注 を一気通貫でトラッキング</Text>
      </View>

      <Text style={styles.sectionTitle}>予定</Text>
      <View style={{ gap: 10, marginBottom: 20 }}>
        {upcoming.map(s => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{s.customerName}</Text>
              <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[s.status]}18` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[s.status] }]}>
                  {STATUS_LABEL[s.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.schedule}>
              {new Date(s.scheduledAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' })}
            </Text>
            {s.memo && <Text style={styles.memo}>{s.memo}</Text>}
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>来場実績</Text>
      <View style={{ gap: 10 }}>
        {past.map(s => (
          <View key={s.id} style={styles.cardVisited}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{s.customerName}</Text>
              <View style={[styles.statusPill, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Text style={[styles.statusText, { color: Accent.emerald }]}>来場済</Text>
              </View>
            </View>
            <Text style={styles.schedule}>
              {new Date(s.scheduledAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit' })}
            </Text>
            {s.tastedProducts && (
              <View style={styles.tastedRow}>
                <Text style={styles.tastedLabel}>試食：</Text>
                <Text style={styles.tastedValue}>{s.tastedProducts.join(', ')}</Text>
              </View>
            )}
            {s.memo && <Text style={styles.memo}>{s.memo}</Text>}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4, marginBottom: 16 },

  hero: {
    backgroundColor: Brand.navy, borderRadius: Radius.xl, padding: 22, marginBottom: 20,
  },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  heroValue: { color: '#fff', fontSize: 44, fontWeight: '800', marginTop: 6 },
  heroUnit: { fontSize: 16, fontWeight: '500' },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 10 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: Ink[700], marginBottom: 10 },

  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Ink[100] },
  cardVisited: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: Ink[900], flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '700' },
  schedule: { fontSize: 12, color: Ink[700], marginTop: 8 },
  tastedRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  tastedLabel: { fontSize: 11, color: Ink[500] },
  tastedValue: { fontSize: 11, color: Ink[900], fontWeight: '600' },
  memo: { fontSize: 11, color: Ink[500], marginTop: 8, lineHeight: 16 },
});
