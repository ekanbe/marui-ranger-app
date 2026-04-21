import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Colors, Ink } from '@/constants/theme';

type IconName = 'home' | 'store' | 'box' | 'yen' | 'more';

function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  const glyph = name === 'home'  ? '⌂'
             : name === 'store' ? '◉'
             : name === 'box'   ? '▣'
             : name === 'yen'   ? '¥'
             :                    '⋯';
  return (
    <View style={[styles.icon, focused && styles.iconFocused]}>
      <Text style={{ color: focused ? '#fff' : color, fontSize: 16, fontWeight: '700' }}>{glyph}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Brand.navy,
        tabBarInactiveTintColor: Ink[500],
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: Colors.light.border,
          height: 72,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index"     options={{ title: 'ホーム', tabBarIcon: (p) => <TabIcon name="home"  {...p} /> }} />
      <Tabs.Screen name="customers" options={{ title: '顧客',   tabBarIcon: (p) => <TabIcon name="store" {...p} /> }} />
      <Tabs.Screen name="products"  options={{ title: '商品',   tabBarIcon: (p) => <TabIcon name="box"   {...p} /> }} />
      <Tabs.Screen name="margin"    options={{ title: 'マージン', tabBarIcon: (p) => <TabIcon name="yen"   {...p} /> }} />
      <Tabs.Screen name="more"      options={{ title: 'その他', tabBarIcon: (p) => <TabIcon name="more"  {...p} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  iconFocused: { backgroundColor: Brand.navy },
});
