import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import { useProductDetail } from '@/hooks/use-product-detail';
import { jpy } from '@/lib/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading } = useProductDetail(id);

  if (loading) {
    return (
      <Screen>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Brand.navy} />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen>
        <Text style={styles.notFound}>商品が見つかりません</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.hero}>
        {detail.image_url ? (
          <Image source={{ uri: detail.image_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}
        <Text style={styles.name}>{detail.name}</Text>
        <Text style={styles.meta}>
          {detail.maker_name} / {detail.category ?? '-'}
        </Text>
        <Text style={styles.price}>{jpy(detail.unit_price_jpy)}</Text>
      </View>

      {detail.pain_solution && (
        <View style={styles.painBox}>
          <Text style={styles.painLabel}>解決する悲鳴</Text>
          <Text style={styles.painText}>{detail.pain_solution}</Text>
        </View>
      )}

      {detail.pitch_script && (
        <View style={styles.pitchBox}>
          <Text style={styles.pitchLabel}>提案トーク</Text>
          <Text style={styles.pitchText}>{detail.pitch_script}</Text>
        </View>
      )}

      {detail.solves_pain.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>マッチする悲鳴</Text>
          <View style={styles.tagRow}>
            {detail.solves_pain.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>この商品が推薦されている顧客</Text>
        {detail.recommended_customers.length === 0 ? (
          <Text style={styles.empty}>推薦対象の顧客がいません</Text>
        ) : (
          detail.recommended_customers.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push({ pathname: '/customer/[id]', params: { id: c.id } })}
              style={styles.recommendedRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>
                  {c.name}
                  {c.branch_name ? ` ${c.branch_name}` : ''}
                </Text>
                <Text style={styles.customerArrow}>詳細を見る →</Text>
              </View>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>{Math.min(100, Math.round(c.score * 100))}%</Text>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  notFound: { paddingVertical: 48, textAlign: 'center', color: Ink[500] },

  hero: { alignItems: 'center', marginBottom: 20 },
  image: { width: 160, height: 160, borderRadius: Radius.lg, backgroundColor: Ink[100], marginBottom: 14 },
  imagePlaceholder: { backgroundColor: Ink[100] },
  name: { fontSize: 22, fontWeight: '800', color: Ink[900], textAlign: 'center' },
  meta: { fontSize: 12, color: Ink[500], marginTop: 4 },
  price: { fontSize: 20, fontWeight: '800', color: Brand.navy, marginTop: 10 },

  painBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
  },
  painLabel: { fontSize: 10, color: Accent.red, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  painText: { fontSize: 14, color: Ink[900], marginTop: 6, fontWeight: '600' },

  pitchBox: {
    backgroundColor: 'rgba(30,58,95,0.05)',
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 18,
  },
  pitchLabel: { fontSize: 10, color: Brand.navy, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  pitchText: { fontSize: 13, color: Ink[700], marginTop: 6, lineHeight: 20 },

  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Ink[700], marginBottom: 10 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Ink[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagText: { fontSize: 10, color: Ink[700] },

  empty: { paddingVertical: 16, textAlign: 'center', color: Ink[500], fontSize: 12 },
  recommendedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Ink[100],
    marginBottom: 8,
  },
  customerName: { fontSize: 14, fontWeight: '600', color: Ink[900] },
  customerArrow: { fontSize: 11, color: Brand.navy, fontWeight: '600', marginTop: 4 },
  scorePill: { backgroundColor: Brand.navy, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  scoreText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
