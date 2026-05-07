import { Tabs } from 'expo-router';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Colors, Ink } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useIsWide } from '@/hooks/use-is-wide';
import { useProfile } from '@/hooks/use-profile';

type IconName = 'home' | 'store' | 'box' | 'yen' | 'more' | 'people';

const ICONS: Record<IconName, number> = {
  home:   require('@/assets/icons/tab-home.png'),
  store:  require('@/assets/icons/tab-customers.png'),
  box:    require('@/assets/icons/tab-products.png'),
  yen:    require('@/assets/icons/tab-margin.png'),
  people: require('@/assets/icons/tab-rangers.png'),
  more:   require('@/assets/icons/tab-more.png'),
};

function TabIcon({ name, focused }: { name: IconName; color: string; focused: boolean }) {
  return (
    <View style={styles.iconBox}>
      <Image
        source={ICONS[name]}
        style={[
          styles.icon,
          { tintColor: focused ? Brand.navy : Ink[400] },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

export default function TabLayout() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  // 管理機能は Web 限定。ネイティブでは admin もタブ上は ranger 扱い。
  const isAdmin = profile?.role === 'admin' && Platform.OS === 'web';
  const isWide = useIsWide();
  // admin + PC では AdminShell のサイドバーがナビを担うのでタブバー非表示
  const hideTabBar = isAdmin && isWide;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Brand.navy,
        tabBarInactiveTintColor: Ink[400],
        tabBarStyle: hideTabBar
          ? { display: 'none' }
          : {
              backgroundColor: Colors.light.surface,
              borderTopColor: Ink[100],
              borderTopWidth: 1,
              height: 78,
              paddingBottom: 14,
              paddingTop: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.04,
              shadowRadius: 12,
              elevation: 8,
            },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
      }}
    >
      {/* 順序：ホーム | 顧客 | マージン(ranger)or レンジャー(admin) | 商品 | その他 */}
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'ダッシュボード' : 'ホーム',
          tabBarIcon: (p) => <TabIcon name="home" {...p} />,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{ title: '顧客', tabBarIcon: (p) => <TabIcon name="store" {...p} /> }}
      />
      <Tabs.Screen
        name="margin"
        options={{
          title: 'マージン',
          tabBarIcon: (p) => <TabIcon name="yen" {...p} />,
          href: isAdmin ? null : '/(tabs)/margin',
        }}
      />
      <Tabs.Screen
        name="rangers"
        options={{
          title: 'レンジャー',
          tabBarIcon: (p) => <TabIcon name="people" {...p} />,
          href: isAdmin ? '/(tabs)/rangers' : null,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: '商品', tabBarIcon: (p) => <TabIcon name="box" {...p} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'その他', tabBarIcon: (p) => <TabIcon name="more" {...p} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { width: 24, height: 24 },
});
