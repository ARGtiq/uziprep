import { useRef, useState } from 'react';
import type { StepItem } from '@/types/station';
import { askAiTutorOnce } from '@/lib/aiClient';
import { isAiConfigured } from '@/lib/aiSettings';
import { Icon } from '@/components/Icon';
import { addXp } from '@/lib/streakAndXp';

interface Props {
  stationId?: string;
  scenarioName: string;
  steps: StepItem[];
}

// Web Speech API не описан в стандартных lib.dom.d.ts для Safari/старых
// типов — минимальный локальный тип вместо `any`.
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Пользователь надиктовывает алгоритм своими словами, распознавание —
 * через браузерный Web Speech API (бесплатно, без сети до модели, но
 * сам API у части браузеров всё равно ходит в облако Google/Apple —
 * это ограничение платформы, не наше). Транскрипт целиком уходит в AI
 * с эталонным списком шагов, модель отмечает пропущенные пункты и
 * грубые ошибки порядка. Работает только в Chrome/Edge (и Safari
 * частично) — Firefox Web Speech API не поддерживает, тогда просто
 * скрываем кнопку записи и даём только текстовое поле.
 */
export function VoiceRecallTrainer({ stationId, scenarioName, steps }: Props) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const SpeechRecognitionCtor = getSpeechRecognition();
  const aiReady = isAiConfigured();

  function startRecording() {
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + ' ';
      }
      setTranscript(text.trim());
    };
    recognition.onerror = () => setError('Не удалось распознать речь — проверь разрешение на микрофон');
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setFeedback(null);
    setError(null);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function checkWithAi() {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const prompt =
        `Пользователь готовится к медицинскому ОСКЭ-экзамену и надиктовал по памяти алгоритм станции ` +
        `"${scenarioName}". Вот эталонная последовательность шагов из официального паспорта:\n\n` +
        steps.map((s, i) => `${i + 1}. ${s.text}`).join('\n') +
        `\n\nВот что он произнёс своими словами:\n"${transcript}"\n\n` +
        `Кратко (списком) укажи: какие важные шаги он пропустил, что перепутал по порядку. ` +
        `Не придирайся к дословности формулировок — оценивай только полноту и логику последовательности.`;
      const reply = await askAiTutorOnce(prompt);
      setFeedback(reply);
      addXp(stationId ?? 'exam', 5); // фиксированный XP за факт прохождения — AI-ответ произвольный, нет чёткого "верно/неверно"
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить разбор');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="mb-3 text-xs text-on-surface-variant">
        Расскажи алгоритм своими словами вслух (или впиши текстом), затем попроси AI сверить с эталоном.
      </p>

      {SpeechRecognitionCtor ? (
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`mb-3 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
            recording ? 'bg-error text-white' : 'bg-primary text-on-primary'
          }`}
        >
          <Icon name={recording ? 'cancel' : 'auto_awesome'} size={16} />
          {recording ? 'Остановить запись' : 'Начать надиктовку'}
        </button>
      ) : (
        <p className="mb-3 text-xs text-on-surface-variant">
          Голосовой ввод не поддерживается этим браузером (работает в Chrome/Edge) — впиши текстом ниже.
        </p>
      )}

      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Текст появится тут по мере надиктовки, либо впиши вручную..."
        rows={5}
        className="mb-3 w-full rounded-m3-md border border-outline-variant bg-surface p-3 text-sm"
      />

      {aiReady ? (
        <button
          onClick={checkWithAi}
          disabled={loading || !transcript.trim()}
          className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary disabled:opacity-40"
        >
          {loading ? 'Сверяю...' : 'Сверить с эталоном (AI)'}
        </button>
      ) : (
        <p className="text-xs text-on-surface-variant">Настрой AI в Профиле, чтобы получить разбор от модели.</p>
      )}

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
      {feedback && <div className="mt-3 rounded-m3-md bg-surface-container-low p-3 text-sm leading-relaxed">{feedback}</div>}
    </div>
  );
}
