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
import { Brand, Ink, Radius } from '@/constants/theme';
import { useProductDetail } from '@/hooks/use-product-detail';
import { jpy } from '@/lib/format';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, loading } = useProductDetail(id);

  if (loading) {
    return (
      <Screen back>
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen back>
        <Text style={styles.notFound}>商品が見つかりません</Text>
      </Screen>
    );
  }

  return (
    <Screen back>
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
        {detail.bcart_sets.length === 0 && detail.unit_price_jpy > 0 ? (
          <Text style={styles.price}>{jpy(detail.unit_price_jpy)}</Text>
        ) : null}
      </View>

      {/* Bカート BtoB価格（販売単位ごと） */}
      {detail.bcart_sets.length > 0 ? (
        <>
          <SectionTitle
            title="🏢 Bカート BtoB価格"
            caption="見積・受注で使う実価格"
            style={{ marginTop: 4 }}
          />
          {detail.bcart_sets.map((set) => (
            <View key={set.id} style={styles.bcartSetCard}>
              <View style={styles.bcartSetHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bcartSetName}>{set.name ?? '販売単位'}</Text>
                  {set.product_no ? (
                    <Text style={styles.bcartSetMeta}>商品番号 {set.product_no}</Text>
                  ) : null}
                </View>
                {set.unit_price != null ? (
                  <Text style={styles.bcartSetPrice}>{jpy(set.unit_price)}</Text>
                ) : null}
              </View>

              {set.group_prices.length > 0 ? (
                <View style={styles.bcartGroupList}>
                  <Text style={styles.bcartGroupLabel}>価格グループ別</Text>
                  {set.group_prices.map((g) => (
                    <View key={g.price_group_id} style={styles.bcartGroupRow}>
                      <Text style={styles.bcartGroupName}>{g.name}</Text>
                      <Text style={styles.bcartGroupPrice}>{jpy(g.unit_price)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {set.special_price_count > 0 ? (
                <View style={styles.bcartSpecialBox}>
                  <Text style={styles.bcartSpecialLabel}>
                    🎯 特別単価あり ({set.special_price_count} 顧客)
                  </Text>
                  <Text style={styles.bcartSpecialHint}>
                    価格交渉の結果が登録済み。顧客詳細で確認できます。
                  </Text>
                </View>
              ) : null}

              {set.stock != null ? (
                <Text style={styles.bcartStock}>在庫: {set.stock}</Text>
              ) : null}
            </View>
          ))}
        </>
      ) : null}

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
            {detail.solves_pain.map((t) => <Badge key={t} label={t} tone="red" size="md" />)}
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
  price: { fontSize: 26, fontWeight: '900', color: Ink[900], marginTop: 12, letterSpacing: -0.5 },

  // Bカート 販売単位カード
  bcartSetCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Ink[100],
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 12,
  },
  bcartSetHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bcartSetName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  bcartSetMeta: {
    fontSize: 11,
    color: Ink[500],
    marginTop: 2,
    fontFamily: 'monospace',
  },
  bcartSetPrice: { fontSize: 20, fontWeight: '900', color: Brand.gold },

  bcartGroupList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Ink[100],
    gap: 4,
  },
  bcartGroupLabel: {
    fontSize: 10,
    color: Ink[500],
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bcartGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bcartGroupName: { fontSize: 12, color: Ink[700] },
  bcartGroupPrice: { fontSize: 13, fontWeight: '700', color: Ink[900] },

  bcartSpecialBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(201,168,118,0.08)',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(201,168,118,0.25)',
  },
  bcartSpecialLabel: { fontSize: 12, fontWeight: '800', color: Brand.navy },
  bcartSpecialHint: { fontSize: 10, color: Ink[600], marginTop: 4 },
  bcartStock: { fontSize: 10, color: Ink[500], marginTop: 8, textAlign: 'right' },

  painBox: {
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
  },
  painLabel: { fontSize: 11, color: '#DC2626', fontWeight: '800', letterSpacing: 0.5 },
  painText: { fontSize: 14, color: Ink[900], marginTop: 6, fontWeight: '700', lineHeight: 20 },

  pitchBox: {
    backgroundColor: 'rgba(30,58,95,0.04)',
    borderLeftWidth: 4,
    borderLeftColor: Brand.navy,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 18,
  },
  pitchLabel: { fontSize: 11, color: Ink[900], fontWeight: '800', letterSpacing: 0.5 },
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
