import { useState } from 'react';
import { getSonogramsForBlock, sonogramUrl } from '@/lib/sonograms';
import { Icon } from '@/components/Icon';

interface Props {
  stationId: string;
  scenarioIndex: number;
  blockStepNums: number[];
}

/**
 * Эталонные сонограммы для блока — свёрнуто по умолчанию (как
 * мнемоника/легенда), превью в ряд, тап открывает полноэкранно.
 * Ничего не показывает, если для этого блока сонограмм нет.
 */
export function SonogramGallery({ stationId, scenarioIndex, blockStepNums }: Props) {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState<string | null>(null);
  const entries = getSonogramsForBlock(stationId, scenarioIndex, blockStepNums);

  if (entries.length === 0) return null;

  return (
    <div className="mb-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs font-semibold text-primary">
        <Icon name="grid_view" size={12} />
        {open ? 'Скрыть' : 'Показать'} эталонные сонограммы ({entries.length})
      </button>

      {open && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {entries.map((e) => {
            const url = sonogramUrl(stationId, scenarioIndex, e.file);
            return (
              <button key={e.file} onClick={() => setFullscreen(url)} className="shrink-0">
                <img src={url} alt="Эталонная сонограмма" className="h-24 w-24 rounded-m3-sm object-cover" loading="lazy" />
              </button>
            );
          })}
        </div>
      )}

      {fullscreen && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreen(null)}
        >
          <img src={fullscreen} alt="Эталонная сонограмма, увеличено" className="max-h-full max-w-full rounded-m3-md object-contain" />
          <button onClick={() => setFullscreen(null)} aria-label="Закрыть" className="absolute right-4 top-4 text-white">
            <Icon name="close" size={28} />
          </button>
        </div>
      )}
    </div>
  );
}
