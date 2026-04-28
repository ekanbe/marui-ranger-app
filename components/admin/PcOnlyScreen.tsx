import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Brand, Ink, Radius } from '@/constants/theme';
import { signOut } from '@/hooks/use-auth';

export function PcOnlyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🖥️</Text>
        <Text style={styles.title}>PCからアクセスしてください</Text>
        <Text style={styles.message}>
          管理者機能は、操作性と視認性のため
          {'\n'}
          PCブラウザ専用です。
        </Text>
        <View style={styles.urlBox}>
          <Text style={styles.urlLabel}>アクセス先</Text>
          <Text style={styles.url}>ekanbe.github.io/marui-ranger-app</Text>
        </View>
        <View style={{ marginTop: 24 }}>
          <Button
            label="ログアウト"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => signOut()}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.navyDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 32,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Ink[900],
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13,
    color: Ink[600],
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  urlBox: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Ink[50],
    borderRadius: Radius.sm,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  urlLabel: { fontSize: 10, color: Ink[500], fontWeight: '700', letterSpacing: 0.5 },
  url: { fontSize: 12, color: Brand.navy, fontWeight: '700', marginTop: 4 },
});
