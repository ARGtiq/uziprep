import { useEffect, useRef, useState } from 'react';
import type { StepItem } from '@/types/station';
import { Icon } from '@/components/Icon';

interface Props {
  steps: StepItem[];
}

function getVoicesWithRetry(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    // На части Android/PWA-контекстов 'voiceschanged' может вообще не
    // выстрелить — поэтому не полагаемся только на событие, а ещё и
    // опрашиваем сам список с интервалом, ограниченное время.
    let settled = false;
    const finish = (voices: SpeechSynthesisVoice[]) => {
      if (settled) return;
      settled = true;
      resolve(voices);
    };
    window.speechSynthesis.onvoiceschanged = () => finish(window.speechSynthesis.getVoices());
    let attempts = 0;
    const poll = setInterval(() => {
      attempts++;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 || attempts >= 20) {
        clearInterval(poll);
        finish(voices);
      }
    }, 150);
  });
}

/**
 * Озвучка через браузерный SpeechSynthesis. Частая причина "TTS
 * вообще не работает" на Android — в системе не установлен/не скачан
 * голосовой пакет для русского языка (Настройки → Спец. возможности →
 * Синтез речи → Google TTS → языки). Это не баг приложения — движок
 * просто не может ничего сказать без голоса. Поэтому явно показываем
 * диагностику (сколько голосов найдено, есть ли среди них русский) и
 * даём короткую тестовую фразу для быстрой проверки без прослушивания
 * всего алгоритма.
 */
export function AudioNarration({ steps }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voicesInfo, setVoicesInfo] = useState<{ total: number; ruCount: number } | null>(null);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!supported) return;
    getVoicesWithRetry().then((voices) => {
      setVoicesInfo({ total: voices.length, ruCount: voices.filter((v) => v.lang.toLowerCase().startsWith('ru')).length });
    });
    return () => {
      window.speechSynthesis.cancel();
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pickVoice(): Promise<SpeechSynthesisVoice | null> {
    const voices = await getVoicesWithRetry();
    return voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ?? null;
  }

  async function speakText(text: string, onDone?: () => void) {
    const voice = await pickVoice();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    u.rate = 0.95;
    if (voice) u.voice = voice;
    u.onerror = (e) => setError(`Ошибка синтеза речи: ${e.error || 'неизвестная'}`);
    if (onDone) u.onend = onDone;
    window.speechSynthesis.speak(u);
    return u;
  }

  async function testVoice() {
    setError(null);
    window.speechSynthesis.cancel();
    await speakText('Проверка озвучки. Если ты это слышишь — всё работает.');
  }

  async function play() {
    setError(null);
    window.speechSynthesis.cancel();
    setPlaying(true);

    const voice = await pickVoice();
    if (!voice && voicesInfo && voicesInfo.ruCount === 0) {
      // Голоса вообще есть, но русского среди них нет — попробуем всё
      // равно (иногда движок всё же читает латиницей/с акцентом), но
      // предупредим заранее, а не молчим.
      setError('Русский голос не найден в системе — попробую озвучить доступным, может звучать странно.');
    }

    const utterances = steps.map((step, i) => {
      const u = new SpeechSynthesisUtterance(`${i + 1}. ${step.text}`);
      u.lang = 'ru-RU';
      u.rate = 0.95;
      if (voice) u.voice = voice;
      u.onstart = () => setCurrentIndex(i);
      u.onerror = (e) => {
        setPlaying(false);
        setError(`Ошибка синтеза речи: ${e.error || 'неизвестная'}. Проверь, установлен ли голосовой пакет в системе.`);
      };
      return u;
    });
    const last = utterances[utterances.length - 1];
    last.onend = () => {
      setPlaying(false);
      setCurrentIndex(null);
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    };

    // Все speak() вызываем синхронно здесь же, внутри клика — важно
    // для надёжности на мобильных/PWA (иначе движок может проигнорировать
    // вызовы вне прямого пользовательского жеста).
    utterances.forEach((u) => window.speechSynthesis.speak(u));

    resumeIntervalRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
    }, 5000);

    setTimeout(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        setPlaying(false);
        setError('Озвучка не запустилась. Проверь кнопкой "Тест" ниже — если тест тоже молчит, дело в системных настройках голоса, не в приложении.');
      }
    }, 1500);
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
        <button onClick={testVoice} className="shrink-0 rounded-full border border-outline-variant px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
          Тест
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
      {voicesInfo && voicesInfo.ruCount === 0 && (
        <p className="mt-2 text-[11px] text-on-surface-variant">
          Голосов найдено: {voicesInfo.total}, русских — 0. Проверь в системных настройках телефона: Спец.
          возможности → Синтез речи → скачан ли русский языковой пакет.
        </p>
      )}
    </div>
  );
}
