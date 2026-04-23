import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useProducts } from '@/hooks/use-products';
import { jpy } from '@/lib/format';

export default function ProductsScreen() {
  const { products, loading } = useProducts();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>商品カタログ</Text>
        <Text style={styles.sub}>悲鳴を解く {products.length} 商品</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {products.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
              style={styles.card}
            >
              <View style={styles.top}>
                {p.image_url ? (
                  <Image source={{ uri: p.image_url }} style={styles.image} contentFit="cover" />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.pname}>{p.name}</Text>
                  <Text style={styles.pmeta}>
                    {p.maker_name} / {p.category ?? '-'}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{jpy(p.unit_price_jpy)}</Text>
                  </View>
                </View>
              </View>

              {p.pain_solution && (
                <View style={styles.painBox}>
                  <Text style={styles.painLabel}>解決する悲鳴</Text>
                  <Text style={styles.painText}>{p.pain_solution}</Text>
                </View>
              )}

              {p.pitch_script && (
                <View style={styles.pitchBox}>
                  <Text style={styles.pitchLabel}>提案トーク</Text>
                  <Text style={styles.pitchText}>{p.pitch_script}</Text>
                </View>
              )}

              {p.solves_pain.length > 0 && (
                <View style={styles.tagRow}>
                  {p.solves_pain.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
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
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 4 },

  loadingBox: { paddingVertical: 48, alignItems: 'center' },

  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Ink[100] },
  top: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  image: { width: 88, height: 88, borderRadius: Radius.md, backgroundColor: Ink[100] },
  imagePlaceholder: { backgroundColor: Ink[100] },
  pname: { fontSize: 16, fontWeight: '700', color: Ink[900] },
  pmeta: { fontSize: 11, color: Ink[500], marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  price: { fontSize: 18, fontWeight: '800', color: Ink[900] },

  painBox: { backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: Radius.md, padding: 12, marginBottom: 10 },
  painLabel: { fontSize: 10, color: Accent.red, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  painText: { fontSize: 13, color: Ink[900], marginTop: 4 },

  pitchBox: { backgroundColor: 'rgba(30,58,95,0.04)', borderRadius: Radius.md, padding: 12, marginBottom: 10 },
  pitchLabel: { fontSize: 10, color: Brand.navy, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  pitchText: { fontSize: 13, color: Ink[700], marginTop: 4, lineHeight: 18 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Ink[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 10, color: Ink[700] },
});
