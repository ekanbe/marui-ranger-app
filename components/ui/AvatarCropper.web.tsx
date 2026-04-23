// Web (PWA) 専用のアバタークロップUI
// react-easy-crop で円形マスク + pan/zoom、canvas で切り抜き

import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Appetite, Brand, Ink, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { type CropArea, cropToBlob } from '@/lib/cropImage';

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
  submitting?: boolean;
};

export function AvatarCropper({ imageSrc, onCancel, onConfirm, submitting }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixelArea, setPixelArea] = useState<CropArea | null>(null);

  const onCropComplete = useCallback((_: unknown, areaPx: CropArea) => {
    setPixelArea(areaPx);
  }, []);

  async function confirm() {
    if (!pixelArea) return;
    const blob = await cropToBlob(imageSrc, pixelArea, 512, 'image/jpeg', 0.88);
    await onConfirm(blob);
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>範囲を調整</Text>
      <Text style={styles.sub}>ドラッグで位置、スライダーでズーム</Text>

      <View style={styles.cropWrap}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: {
              backgroundColor: '#000',
              borderRadius: 20,
            },
            mediaStyle: {},
            cropAreaStyle: {
              border: '2px solid #fff',
              color: 'rgba(0,0,0,0.55)',
            },
          }}
        />
      </View>

      {/* ズームスライダー（HTML input range をネイティブっぽく見せる） */}
      <View style={styles.zoomRow}>
        <Pressable
          onPress={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
          style={styles.zoomBtn}
        >
          <Text style={styles.zoomBtnText}>−</Text>
        </Pressable>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number((e.target as HTMLInputElement).value))}
          style={{
            flex: 1,
            accentColor: Brand.navy,
            height: 4,
          } as any}
        />
        <Pressable
          onPress={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
          style={styles.zoomBtn}
        >
          <Text style={styles.zoomBtnText}>＋</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label="キャンセル" variant="secondary" size="md" fullWidth onPress={onCancel} disabled={submitting} />
        </View>
        <View style={{ flex: 2 }}>
          <Button label="この範囲で決定" variant="cta" size="md" fullWidth onPress={confirm} loading={submitting} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Ink[200],
  },
  title: { fontSize: 16, fontWeight: '800', color: Ink[900], letterSpacing: -0.2 },
  sub: { fontSize: 11, color: Ink[500], marginTop: 4, marginBottom: 12 },

  cropWrap: {
    position: 'relative',
    height: 320,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 14,
  },

  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  zoomBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Ink[100],
    alignItems: 'center', justifyContent: 'center',
  },
  zoomBtnText: { fontSize: 18, fontWeight: '800', color: Ink[900] },

  actions: { flexDirection: 'row', gap: 8 },
});

void Appetite;
