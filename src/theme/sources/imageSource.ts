/**
 * Извлекает доминирующий насыщенный цвет из изображения через canvas —
 * ближайший к "настоящему" Material You (цвет обоев) вариант, реально
 * доступный в браузере без нативного моста. Не использует внутренние
 * API material-color-utilities напрямую (могут отличаться между
 * версиями пакета) — считает сам, простым и предсказуемым способом:
 * уменьшает картинку до маленького превью, строит гистограмму по
 * квантованным (округлённым) RGB-корзинам с весом по насыщенности,
 * берёт самую "тяжёлую" корзину.
 */
export async function extractDominantColorHex(file: File): Promise<string> {
  const bitmap = await loadImage(file);
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas недоступен');
  ctx.drawImage(bitmap, 0, 0, size, size);

  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    if (alpha < 200) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const lightness = max / 255;
    // Пропускаем почти-белые/почти-чёрные/совсем бесцветные пиксели —
    // они дают скучный серый seed вместо характерного цвета фото
    if (lightness > 0.95 || lightness < 0.08 || saturation < 0.12) continue;

    const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
    const weight = 1 + saturation * 2; // насыщенные пиксели весят больше
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += weight;
      bucket.r += r * weight;
      bucket.g += g * weight;
      bucket.b += b * weight;
    } else {
      buckets.set(key, { count: weight, r: r * weight, g: g * weight, b: b * weight });
    }
  }

  let best: { count: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }
  if (!best) return '#0F6E56'; // фолбэк на дефолтный seed, если фото совсем однотонное

  const r = Math.round(best.r / best.count);
  const g = Math.round(best.g / best.count);
  const b = Math.round(best.b / best.count);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
