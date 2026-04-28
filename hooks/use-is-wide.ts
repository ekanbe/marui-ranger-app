import { useWindowDimensions } from 'react-native';

/**
 * 画面幅が threshold 以上（デフォルト768px = PCビュー）かを判定。
 */
export function useIsWide(threshold = 768) {
  const { width } = useWindowDimensions();
  return width >= threshold;
}
