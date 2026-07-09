import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerList } from '@/components/ui/Shimmer';
import { Accent, Ink, Radius } from '@/constants/theme';
import { useCostCatalog } from '@/hooks/use-cost-catalog';
import { jpy } from '@/lib/format';

export default function ProductsScreen() {
  const { items, loading, error, reload } = useCostCatalog();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [items]);

  const list = items.filter(
    (p) =>
      (cat === 'all' || p.category === cat) &&
      (query === '' || `${p.name}${p.maker ?? ''}${p.category ?? ''}`.includes(query))
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>商品カタログ</Text>
          <Text style={styles.subtitle}>原価表 {items.length} 商品</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="商品・メーカーで検索"
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

      {categories.length > 0 && (
        <ChipRow style={{ marginBottom: 16 }}>
          <Chip label="すべて" active={cat === 'all'} onPress={() => setCat('all')} count={items.length} />
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              active={cat === c}
              onPress={() => setCat(cat === c ? 'all' : c)}
              count={items.filter((p) => p.category === c).length}
            />
          ))}
        </ChipRow>
      )}

      {loading ? (
        <ShimmerList count={3} />
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="読み込みに失敗しました"
          message={error}
          actionLabel="再読み込み"
          onAction={reload}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon="📦"
          title="該当する商品がありません"
          message="別のキーワードやカテゴリで試してみてください"
        />
      ) : (
        <View style={{ gap: 10 }}>
          {list.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.thumbWrap}>
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.thumb} contentFit="contain" />
                ) : (
                  <Text style={{ fontSize: 22 }}>📦</Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.pname} numberOfLines={2}>{p.name}</Text>
                <View style={styles.metaRow}>
                  {p.category ? <Badge label={p.category} tone="navy" /> : null}
                </View>
                {p.units_per_case ? (
                  <Text style={styles.caseInfo}>
                    {p.balls_per_case != null && p.units_per_ball != null
                      ? `${p.balls_per_case}BL × ${p.units_per_ball}個 ＝ ${p.units_per_case}バラ/ｹｰｽ`
                      : `${p.units_per_case}バラ/ｹｰｽ`}
                  </Text>
                ) : null}
              </View>
              <View style={styles.costBox}>
                {/* バラ原価は小数まで表示(整数に丸めるとケース原価との検算が合わなくなる) */}
                <Text style={styles.cost}>
                  ¥{p.cost_price_jpy.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.costUnit}>バラ原価</Text>
                {p.case_cost_jpy != null ? (
                  <>
                    <Text style={styles.caseCost}>{jpy(p.case_cost_jpy)}</Text>
                    <Text style={styles.costUnit}>ケース原価</Text>
                  </>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 14 },
  title: { fontSize: 24, fontWeight: '800', color: Ink[900], letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: Ink[500], marginTop: 4 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderWidth: 1, borderColor: Ink[200], borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, color: Ink[900], padding: 0 },
  clearIcon: { fontSize: 14, color: Ink[400], paddingHorizontal: 4 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Ink[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  thumbWrap: {
    width: 52, height: 52, borderRadius: Radius.sm, overflow: 'hidden',
    backgroundColor: Ink[50], alignItems: 'center', justifyContent: 'center',
  },
  thumb: { width: 52, height: 52 },
  pname: { fontSize: 14, fontWeight: '800', color: Ink[900], lineHeight: 19 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  caseInfo: { fontSize: 10, color: Ink[500], marginTop: 5, fontWeight: '600' },
  costBox: { alignItems: 'flex-end' },
  cost: { fontSize: 15, fontWeight: '900', color: Accent.red, letterSpacing: -0.3 },
  caseCost: { fontSize: 13, fontWeight: '800', color: Ink[800], letterSpacing: -0.2, marginTop: 4 },
  costUnit: { fontSize: 9, color: Ink[400], fontWeight: '700', marginTop: 1 },
});
