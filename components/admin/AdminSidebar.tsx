import { Image } from 'expo-image';
import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { roleLabel } from '@/constants/labels';
import { Brand, Ink, Radius } from '@/constants/theme';
import { signOut, useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';

type NavItem = { label: string; path: string; icon: string };

const NAV: NavItem[] = [
  { label: 'ダッシュボード',  path: '/(tabs)',               icon: '📊' },
  { label: '承認待ち受注',    path: '/approvals',            icon: '🔔' },
  { label: '見積依頼管理',    path: '/admin-quote-requests', icon: '📝' },
  { label: 'Bカート見積一覧', path: '/admin-bcart-estimates',icon: '📋' },
  { label: '顧客管理',        path: '/(tabs)/customers',     icon: '🏪' },
  { label: 'レンジャー管理',  path: '/(tabs)/rangers',       icon: '👥' },
  { label: '商品カタログ',    path: '/(tabs)/products',      icon: '📦' },
];

export function AdminSidebar() {
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const pathname = usePathname();

  const displayName = profile?.display_name ?? '管理者';
  const email = profile?.email ?? session?.user.email ?? '';

  function isActive(path: string) {
    // /(tabs) (index) は pathname が / あるいは /index
    if (path === '/(tabs)') {
      return pathname === '/' || pathname === '/index' || pathname === '/(tabs)';
    }
    const stripped = path.replace('/(tabs)', '');
    return pathname === stripped || pathname.startsWith(stripped + '/');
  }

  return (
    <View style={styles.sidebar}>
      {/* ロゴヘッダー */}
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          contentFit="cover"
        />
        <View>
          <Text style={styles.brandTitle}>RANGER</Text>
          <Text style={styles.brandSub}>Admin Console</Text>
        </View>
      </View>

      {/* ナビ */}
      <View style={styles.nav}>
        {NAV.map((item) => {
          const active = isActive(item.path);
          return (
            <Pressable
              key={item.path}
              onPress={() => router.push(item.path as any)}
              style={({ pressed }) => [
                styles.navItem,
                active && styles.navItemActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* プロフィール（下部固定・表示のみ） */}
      <View style={styles.footer}>
        <View style={styles.profile}>
          <Avatar name={displayName} imageUrl={profile?.avatar_url} size="sm" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
          </View>
          <Badge label={roleLabel(profile?.role)} tone="violet" />
        </View>
        <Pressable
          onPress={() => router.push('/password-change' as any)}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.actionText}>🔐 パスワード変更</Text>
        </Pressable>
        <Pressable
          onPress={() => signOut()}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.actionText}>🚪 ログアウト</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: '100%',
    backgroundColor: Brand.navyDeep,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingBottom: 24,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  logo: { width: 40, height: 40, borderRadius: 10 },
  brandTitle: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  brandSub: { color: 'rgba(201,168,118,0.8)', fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginTop: 2 },

  nav: { flex: 1, gap: 4, paddingTop: 16 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  navIcon: { fontSize: 18, width: 22, textAlign: 'center' },
  navLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  navLabelActive: { color: '#fff', fontWeight: '800' },

  footer: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  profileName: { color: '#fff', fontSize: 12, fontWeight: '700' },
  profileEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },

  actionBtn: { padding: 10, alignItems: 'center' },
  actionText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },
});

void Ink;
