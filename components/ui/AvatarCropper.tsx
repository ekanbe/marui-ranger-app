// ネイティブ環境のフォールバック：expo-image-picker の allowsEditing:true を使うため、
// このコンポーネントは呼び出されない想定。型整合のためだけに残す。

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
  submitting?: boolean;
};

export function AvatarCropper(_props: Props): null {
  return null;
}
