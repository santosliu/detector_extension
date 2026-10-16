// 前處理：短邊縮到 440 → center crop 384 → [0,1] → ImageNet normalize（Detectra 模型卡）
const SIZE = 384;
const SHORT = 440;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

function resizeDims(w, h) {
  const s = SHORT / Math.min(w, h);
  return [Math.round(w * s), Math.round(h * s)];
}

function toCHW(rgba, size) {
  const n = size * size;
  const out = new Float32Array(3 * n);
  for (let i = 0; i < n; i++)
    for (let c = 0; c < 3; c++)
      out[c * n + i] = (rgba[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  return out;
}

// 瀏覽器端：ImageBitmap → 模型輸入。一次 drawImage 同時做縮放與置中裁切。
function preprocess(bmp) {
  const [w, h] = resizeDims(bmp.width, bmp.height);
  const ctx = new OffscreenCanvas(SIZE, SIZE).getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, Math.floor((SIZE - w) / 2), Math.floor((SIZE - h) / 2), w, h);
  return toCHW(ctx.getImageData(0, 0, SIZE, SIZE).data, SIZE);
}

if (typeof module !== 'undefined') module.exports = { resizeDims, toCHW, SIZE };
