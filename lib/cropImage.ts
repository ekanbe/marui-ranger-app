// Web 環境専用: canvas で画像を指定矩形にクロップして Blob を返す
// react-easy-crop の onCropComplete で得られる pixel 座標に対応

export type CropArea = { x: number; y: number; width: number; height: number };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function cropToBlob(
  imageSrc: string,
  area: CropArea,
  outputSize = 512,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.88,
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context を取得できませんでした');

  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, outputSize, outputSize,
  );

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob が null を返しました'));
      },
      mimeType,
      quality,
    );
  });
}
