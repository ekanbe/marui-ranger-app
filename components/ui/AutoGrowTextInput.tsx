import { useState } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  /** 最小の高さ(px)。デフォルト44(1行分の通常入力欄と同じ高さ) */
  minHeight?: number;
  /** これ以上は伸びない上限(px)。デフォルト600 */
  maxHeight?: number;
};

/**
 * 入力量に合わせて高さが自動で伸びる複数行TextInput。
 *
 * 固定高さ+内部スクロールだと、スマホで4行を超えたあたりから
 * 「自分がどこを打っているか分からない」状態になる(松永さんFB 2026-07-10)。
 * scrollEnabled=false で内部スクロールを殺し、欄自体を伸ばして
 * ページ側のスクロールに任せることでカーソルが常に見える。
 */
export function AutoGrowTextInput({ minHeight = 44, maxHeight = 600, style, ...rest }: Props) {
  const [height, setHeight] = useState(minHeight);
  return (
    <TextInput
      {...rest}
      multiline
      scrollEnabled={false}
      onContentSizeChange={(e) => {
        const h = Math.ceil(e.nativeEvent.contentSize.height) + 26; // 上下padding分の余白
        setHeight(Math.min(maxHeight, Math.max(minHeight, h)));
      }}
      style={[style, { height, textAlignVertical: 'top' }]}
    />
  );
}
