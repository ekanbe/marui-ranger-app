import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === 'login';
    if (!session && !onLoginScreen) {
      router.replace('/login');
    } else if (session && onLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Brand.navy} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGate>
          <Stack>
            <Stack.Screen name="login"         options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
            <Stack.Screen name="customer/[id]" options={{ title: '顧客詳細' }} />
            <Stack.Screen name="notifications" options={{ title: '通知' }} />
            <Stack.Screen name="ranking"       options={{ title: 'ランキング' }} />
            <Stack.Screen name="showroom"      options={{ title: 'ショールーム' }} />
          </Stack>
        </AuthGate>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
