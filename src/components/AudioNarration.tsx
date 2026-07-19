import { useEffect, useRef, useState } from 'react';
import type { StepItem } from '@/types/station';
import { Icon } from '@/components/Icon';

interface Props {
  steps: StepItem[];
}

/**
 * Озвучка через браузерный SpeechSynthesis — это и есть "системный
 * TTS" (на Android/Chrome он маршрутизируется в системный движок
 * озвучки, обычно Google TTS). Раньше следующий шаг ставился в
 * очередь через setTimeout ИЗ КОЛБЭКА onend — на Android в
 * установленном PWA это часто тихо блокируется политикой user-gesture:
 * speak() вне прямого клика может быть проигнорирован движком.
 *
 * Исправление: ставим ВСЕ утверансы в очередь сразу, синхронно внутри
 * обработчика клика (у speechSynthesis есть встроенная очередь — не
 * нужно ждать onend, чтобы поставить следующий). Плюс периодический
 * resume() — известный баг Chrome, где озвучка "засыпает" примерно
 * через 15 секунд паузы и её нужно вручную будить.
 */
export function AudioNarration({ steps }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickRussianVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ?? null;
  }

  function play() {
    setError(null);
    window.speechSynthesis.cancel();

    const voice = pickRussianVoice();
    const utterances = steps.map((step, i) => {
      const u = new SpeechSynthesisUtterance(`${i + 1}. ${step.text}`);
      u.lang = 'ru-RU';
      u.rate = 0.95;
      if (voice) u.voice = voice;
      u.onstart = () => setCurrentIndex(i);
      return u;
    });
    utterancesRef.current = utterances;
    const last = utterances[utterances.length - 1];
    last.onend = () => {
      setPlaying(false);
      setCurrentIndex(null);
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    };

    // Все speak() вызываем синхронно здесь же, внутри клика — это
    // важно для надёжности на мобильных/PWA (см. комментарий выше).
    utterances.forEach((u) => window.speechSynthesis.speak(u));
    setPlaying(true);

    // Воркэраунд бага Chrome: без этого длинная озвучка может замолчать
    // сама по себе через ~15 секунд паузы между репликами.
    resumeIntervalRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
    }, 5000);

    // Если через секунду движок так и не начал говорить — вероятно,
    // TTS в этом контексте заблокирован (например, установленное PWA
    // без прямого сетевого голоса). Явно сообщаем, а не молчим.
    setTimeout(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        setPlaying(false);
        setError('Озвучка не запустилась — попробуй открыть сайт в обычной вкладке браузера, а не в установленном приложении.');
      }
    }, 1200);
  }

  function stop() {
    window.speechSynthesis.cancel();
    if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    setPlaying(false);
    setCurrentIndex(null);
  }

  if (!supported) return null;

  return (
    <div className="mb-4 rounded-m3-md bg-surface-container-low p-3">
      <div className="flex items-center gap-2.5">
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
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
