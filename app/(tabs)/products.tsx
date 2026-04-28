import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Chip, ChipRow } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerList } from '@/components/ui/Shimmer';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useProducts } from '@/hooks/use-products';
import { jpy } from '@/lib/format';

export default function ProductsScreen() {
  const { products, loading } = useProducts();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => { if (p.category) set.add(p.category); });
    return Array.from(set).sort();
  }, [products]);

  const list = products.filter(
    (p) =>
      (cat === 'all' || p.category === cat) &&
      (query === '' || `${p.name}${p.maker_name}${p.category ?? ''}`.includes(query))
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>商品カタログ</Text>
          <Text style={styles.subtitle}>悲鳴を解く {products.length} 商品</Text>
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
          <Chip label="すべて" active={cat === 'all'} onPress={() => setCat('all')} count={products.length} />
          {categories.map((c) => (
            <Chip
              key={c}
              label={c}
              active={cat === c}
              onPress={() => setCat(cat === c ? 'all' : c)}
              count={products.filter((p) => p.category === c).length}
            />
          ))}
        </ChipRow>
      )}

      {loading ? (
        <ShimmerList count={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="📦"
          title="該当する商品がありません"
          message="別のキーワードやカテゴリで試してみてください"
        />
      ) : (
        <View style={{ gap: 14 }}>
          {list.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            >
              <View style={styles.top}>
                <View style={styles.imageWrap}>
                  {p.image_url ? (
                    <Image source={{ uri: p.image_url }} style={styles.image} contentFit="cover" />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <Text style={{ fontSize: 28 }}>📦</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.maker}>{p.maker_name}</Text>
                  <Text style={styles.pname} numberOfLines={2}>{p.name}</Text>
                  <View style={styles.metaRow}>
                    {p.category ? <Badge label={p.category} tone="navy" /> : null}
                  </View>
                  <Text style={styles.price}>{jpy(p.unit_price_jpy)}</Text>
                </View>
              </View>

              {p.pain_solution ? (
                <View style={styles.painBox}>
                  <Text style={styles.painLabel}>💡 解決する悲鳴</Text>
                  <Text style={styles.painText}>{p.pain_solution}</Text>
                </View>
              ) : null}

              {p.pitch_script ? (
                <View style={styles.pitchBox}>
                  <Text style={styles.pitchLabel}>🎤 提案トーク</Text>
                  <Text style={styles.pitchText} numberOfLines={3}>{p.pitch_script}</Text>
                </View>
              ) : null}

              {p.solves_pain.length > 0 && (
                <View style={styles.tagRow}>
                  {p.solves_pain.map((t) => (
                    <Badge key={t} label={t} tone="red" />
                  ))}
                </View>
              )}
            </Pressable>
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
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Ink[100],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  top: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  imageWrap: {
    width: 92,
    height: 92,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Ink[50],
  },
  image: { width: 92, height: 92 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },

  maker: { fontSize: 10, color: Ink[500], letterSpacing: 0.5, fontWeight: '700', textTransform: 'uppercase' },
  pname: { fontSize: 15, fontWeight: '800', color: Ink[900], marginTop: 4, lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  price: { fontSize: 20, fontWeight: '800', color: Ink[900], marginTop: 6, letterSpacing: -0.3 },

  painBox: {
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderLeftWidth: 3,
    borderLeftColor: Accent.red,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 10,
  },
  painLabel: { fontSize: 10, color: '#DC2626', fontWeight: '800', letterSpacing: 0.5 },
  painText: { fontSize: 13, color: Ink[900], marginTop: 4, lineHeight: 18 },

  pitchBox: {
    backgroundColor: 'rgba(30,58,95,0.04)',
    borderLeftWidth: 3,
    borderLeftColor: Brand.navy,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 10,
  },
  pitchLabel: { fontSize: 10, color: Ink[900], fontWeight: '800', letterSpacing: 0.5 },
  pitchText: { fontSize: 12, color: Ink[700], marginTop: 4, lineHeight: 17 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
