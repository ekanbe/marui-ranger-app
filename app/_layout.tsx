import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AdminShell } from '@/components/admin/AdminShell';
import { PcOnlyScreen } from '@/components/admin/PcOnlyScreen';
import { ErrorBoundary } from '@/components/ranger/ErrorBoundary';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useAutoUpdate } from '@/hooks/use-auto-update';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIsWide } from '@/hooks/use-is-wide';
import { useProfile } from '@/hooks/use-profile';
import { usePushToken } from '@/hooks/use-push-token';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(session);
  const segments = useSegments();
  const router = useRouter();
  const isWide = useIsWide();
  usePushToken(session);
  useAutoUpdate();

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === 'login';
    if (!session && !onLoginScreen) {
      router.replace('/login');
    } else if (session && onLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading || (session && profileLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Brand.navy} />
      </View>
    );
  }

  // 管理機能は Web 限定。iOS/Android は role によらず ranger UI を出す。
  const showAdminUI = session && profile?.role === 'admin' && Platform.OS === 'web';

  if (showAdminUI && !isWide) {
    return <PcOnlyScreen />;
  }
  if (showAdminUI && isWide) {
    return <AdminShell>{children}</AdminShell>;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ErrorBoundary>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="customer/[id]" />
            <Stack.Screen name="customer-edit/[id]" />
            <Stack.Screen name="prospect-new" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="ranger/[id]" />
            <Stack.Screen name="ranger-new" />
            <Stack.Screen name="ranger-edit/[id]" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="approvals" />
            <Stack.Screen name="admin-ec-sync" />
            <Stack.Screen name="admin-showroom" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="ranking" />
            <Stack.Screen name="showroom" />
            <Stack.Screen name="profile-edit" />
          </Stack>
        </AuthGate>
        </ErrorBoundary>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
