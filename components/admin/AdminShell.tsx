import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { AdminSidebar } from './AdminSidebar';

/**
 * admin 用の PC レイアウトラッパー。
 * 左サイドバー + 右メインコンテンツ。
 */
export function AdminShell({ children }: PropsWithChildren) {
  return (
    <View style={styles.root}>
      <AdminSidebar />
      <View style={styles.main}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: Colors.light.surfaceAlt },
  main: { flex: 1, overflow: 'hidden' },
});
