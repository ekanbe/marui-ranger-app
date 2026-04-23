import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Accent, Appetite, Brand, Ink, Radius, Shadow } from '@/constants/theme';

type Trend = 'up' | 'down' | 'flat';
type Tone = 'navy' | 'emerald' | 'amber' | 'red' | 'ember' | 'violet' | 'ink';

type Props = {
  label: string;
  value: string;
  unit?: string;
  trend?: Trend;
  delta?: string;
  tone?: Tone;
  sparkline?: number[];
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

const TONE_COLOR: Record<Tone, string> = {
  navy:    Brand.navy,
  emerald: Accent.emerald,
  amber:   Accent.amber,
  red:     Accent.red,
  ember:   Appetite.ember,
  violet:  Accent.violet,
  ink:     Ink[900],
};

export function KpiCard({ label, value, unit, trend, delta, tone = 'ink', sparkline, icon, style }: Props) {
  const color = TONE_COLOR[tone];
  const trendColor = trend === 'up' ? Accent.emerald : trend === 'down' ? Accent.red : Ink[500];
  const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';

  return (
    <View style={[styles.card, style as ViewStyle]}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        {icon ? <View>{icon}</View> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {(trend || delta) && (
        <View style={styles.trendRow}>
          {trend ? <Text style={[styles.trendSymbol, { color: trendColor }]}>{trendSymbol}</Text> : null}
          {delta ? <Text style={[styles.delta, { color: trendColor }]}>{delta}</Text> : null}
        </View>
      )}
      {sparkline && sparkline.length > 1 ? <Sparkline data={sparkline} color={color} /> : null}
    </View>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  return (
    <View style={styles.spark}>
      {data.map((v, i) => {
        const h = 4 + ((v - min) / range) * 24;
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: h,
              marginRight: i === data.length - 1 ? 0 : 2,
              backgroundColor: color,
              opacity: 0.25 + ((v - min) / range) * 0.75,
              borderRadius: 2,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Ink[100],
    ...Shadow.sm,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontSize: 10,
    color: Ink[500],
    letterSpacing: 0.8,
    fontWeight: '700',
    textTransform: 'none',
  },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 8 },
  value: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  unit: { fontSize: 11, color: Ink[500], marginBottom: 4 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  trendSymbol: { fontSize: 10, fontWeight: '800' },
  delta: { fontSize: 11, fontWeight: '700' },
  spark: { flexDirection: 'row', alignItems: 'flex-end', height: 28, marginTop: 10 },
});
