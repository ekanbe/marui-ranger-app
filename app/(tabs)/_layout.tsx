import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Colors, Ink } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

type IconName = 'home' | 'store' | 'box' | 'yen' | 'more' | 'people';

const GLYPHS: Record<IconName, { on: string; off: string }> = {
  home:   { on: '🏠', off: '🏠' },
  store:  { on: '🏪', off: '🏪' },
  box:    { on: '📦', off: '📦' },
  yen:    { on: '💰', off: '💰' },
  people: { on: '👥', off: '👥' },
  more:   { on: '⋯',  off: '⋯' },
};

function TabIcon({ name, focused }: { name: IconName; color: string; focused: boolean }) {
  const g = GLYPHS[name];
  return (
    <View style={styles.iconBox}>
      <Text style={[styles.iconText, focused && styles.iconTextFocused]}>
        {focused ? g.on : g.off}
      </Text>
      {focused ? <View style={styles.dot} /> : null}
    </View>
  );
}

export default function TabLayout() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const isAdmin = profile?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Brand.navy,
        tabBarInactiveTintColor: Ink[500],
        tabBarStyle: {
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
        name="products"
        options={{ title: '商品', tabBarIcon: (p) => <TabIcon name="box" {...p} /> }}
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
        name="margin"
        options={{
          title: 'マージン',
          tabBarIcon: (p) => <TabIcon name="yen" {...p} />,
          href: isAdmin ? null : '/(tabs)/margin',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'その他', tabBarIcon: (p) => <TabIcon name="more" {...p} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconBox: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconText: { fontSize: 18, opacity: 0.5 },
  iconTextFocused: { opacity: 1 },
  dot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.navy,
  },
});
