import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ranger/Screen';
import { ShimmerCard } from '@/components/ui/Shimmer';
import { Accent } from '@/constants/theme';

/**
 * admin 専用画面の共通ガード表示。
 * profile 読込中は Shimmer、非 admin 確定後は「管理者のみ利用可能です」を表示する。
 *
 * 使い方（各画面側）:
 *   const { profile, loading: profileLoading } = useProfile(session);
 *   const isAdmin = profile?.role === 'admin';
 *   if (profileLoading || !isAdmin) return <AdminGuard loading={profileLoading} />;
 */
export function AdminGuard({ loading, back = true }: { loading: boolean; back?: boolean }) {
  return (
    <Screen back={back}>
      {loading ? (
        <View style={{ gap: 12 }}>
          <ShimmerCard />
          <ShimmerCard />
        </View>
      ) : (
        <Text style={styles.error}>管理者のみ利用可能です</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: Accent.red, fontSize: 12, marginTop: 10 },
});
