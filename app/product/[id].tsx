import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRow } from '@/components/ui/ListRow';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Appetite, Brand, Ink, Radius } from '@/constants/theme';
import { useProductDetail } from '@/hooks/use-product-detail';
import { jpy } from '@/lib/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading } = useProductDetail(id);

  if (loading) {
    return (
      <Screen>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
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
      {/* ヒーロー：商品画像を前面に */}
      <View style={styles.hero}>
        <View style={styles.imageWrap}>
          {detail.image_url ? (
            <Image source={{ uri: detail.image_url }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.image, { alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 48 }}>📦</Text>
            </View>
          )}
        </View>
        <Text style={styles.maker}>{detail.maker_name}</Text>
        <Text style={styles.name}>{detail.name}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, justifyContent: 'center' }}>
          {detail.category ? <Badge label={detail.category} tone="navy" size="md" /> : null}
        </View>
        <Text style={styles.price}>{jpy(detail.unit_price_jpy)}</Text>
      </View>

      {/* 悲鳴 */}
      {detail.pain_solution ? (
        <View style={styles.painBox}>
          <Text style={styles.painLabel}>💡 解決する悲鳴</Text>
          <Text style={styles.painText}>{detail.pain_solution}</Text>
        </View>
      ) : null}

      {/* 提案トーク */}
      {detail.pitch_script ? (
        <View style={styles.pitchBox}>
          <Text style={styles.pitchLabel}>🎤 提案トーク</Text>
          <Text style={styles.pitchText}>{detail.pitch_script}</Text>
        </View>
      ) : null}

      {/* マッチする悲鳴 */}
      {detail.solves_pain.length > 0 && (
        <>
          <SectionTitle title="マッチする悲鳴" />
          <View style={styles.tagRow}>
            {detail.solves_pain.map((t) => <Badge key={t} label={t} tone="ember" size="md" />)}
          </View>
        </>
      )}

      {/* 推薦されている顧客 */}
      <SectionTitle title="この商品が推薦されている顧客" caption={`${detail.recommended_customers.length} 店`} />
      {detail.recommended_customers.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="推薦対象の顧客がいません"
          message="商品属性と顧客の悲鳴がマッチする店舗があれば、ここに自動表示されます"
        />
      ) : (
        <View style={{ gap: 10 }}>
          {detail.recommended_customers.map((c) => {
            const score = Math.min(100, Math.round(c.score * 100));
            return (
              <ListRow
                key={c.id}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: c.id } })}
                title={`${c.name}${c.branch_name ? ` ${c.branch_name}` : ''}`}
                subtitle="タップで詳細を見る"
                trailing={
                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreText}>{score}</Text>
                    <Text style={styles.scoreUnit}>%</Text>
                  </View>
                }
              />
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { paddingVertical: 48, textAlign: 'center', color: Ink[500] },

  hero: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  imageWrap: {
    width: 180,
    height: 180,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Ink[100],
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  image: { width: 180, height: 180 },

  maker: { fontSize: 11, color: Ink[500], fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  name: { fontSize: 20, fontWeight: '800', color: Ink[900], textAlign: 'center', marginTop: 4, letterSpacing: -0.3 },
  price: { fontSize: 26, fontWeight: '900', color: Brand.navy, marginTop: 12, letterSpacing: -0.5 },

  painBox: {
    backgroundColor: 'rgba(234,88,12,0.06)',
    borderLeftWidth: 4,
    borderLeftColor: Appetite.ember,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
  },
  painLabel: { fontSize: 11, color: Appetite.ember, fontWeight: '800', letterSpacing: 0.5 },
  painText: { fontSize: 14, color: Ink[900], marginTop: 6, fontWeight: '700', lineHeight: 20 },

  pitchBox: {
    backgroundColor: 'rgba(30,58,95,0.04)',
    borderLeftWidth: 4,
    borderLeftColor: Brand.navy,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 18,
  },
  pitchLabel: { fontSize: 11, color: Brand.navy, fontWeight: '800', letterSpacing: 0.5 },
  pitchText: { fontSize: 13, color: Ink[700], marginTop: 6, lineHeight: 20 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },

  scoreBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Brand.navy,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 1,
  },
  scoreText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  scoreUnit: { color: '#fff', fontSize: 9, fontWeight: '700', marginTop: 4 },
});
