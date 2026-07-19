import { useEffect, useRef, useState } from 'react';
import type { StepItem } from '@/types/station';
import { Icon } from '@/components/Icon';

interface Props {
  steps: StepItem[];
}

/**
 * Озвучка алгоритма через браузерный SpeechSynthesis — бесплатно, без
 * сети, работает офлайн на большинстве платформ (голос уже установлен
 * в ОС). Читает шаги по очереди, подсвечивая текущий, с паузой между
 * шагами, чтобы успеть осмыслить. Пауза/стоп доступны в любой момент.
 */
export function AudioNarration({ steps }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (supported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speakFrom(index: number) {
    if (!supported || index >= steps.length) {
      setPlaying(false);
      setCurrentIndex(null);
      return;
    }
    cancelledRef.current = false;
    setCurrentIndex(index);
    const utterance = new SpeechSynthesisUtterance(`${index + 1}. ${steps[index].text}`);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.95;
    utterance.onend = () => {
      if (cancelledRef.current) return;
      setTimeout(() => speakFrom(index + 1), 400);
    };
    window.speechSynthesis.speak(utterance);
  }

  function play() {
    setPlaying(true);
    speakFrom(currentIndex !== null && currentIndex < steps.length - 1 ? currentIndex : 0);
  }

  function stop() {
    cancelledRef.current = true;
    window.speechSynthesis.cancel();
    setPlaying(false);
    setCurrentIndex(null);
  }

  if (!supported) return null;

  return (
    <div className="mb-4 flex items-center gap-2.5 rounded-m3-md bg-surface-container-low p-3">
      <button
        onClick={playing ? stop : play}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
        aria-label={playing ? 'Остановить озвучку' : 'Озвучить алгоритм'}
      >
        <Icon name={playing ? 'cancel' : 'auto_awesome'} size={16} />
      </button>
      <div className="flex-1 text-xs text-on-surface-variant">
        {playing && currentIndex !== null
          ? `Читает шаг ${currentIndex + 1} из ${steps.length}`
          : 'Прослушать алгоритм вслух — удобно без телефона в руках'}
      </div>
    </div>
  );
}
