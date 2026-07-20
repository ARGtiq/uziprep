import { useState } from 'react';
import { markOnboardingSeen } from '@/lib/onboarding';
import { Icon } from '@/components/Icon';

interface Props {
  onDone: () => void;
}

const STEPS = [
  {
    icon: 'grid_view' as const,
    title: 'UziPrep — подготовка к аккредитации',
    text: 'Станции с дословными паспортами ОСКЭ: пошаговый алгоритм, чек-лист, тренировка порядка действий. Работает офлайн.',
  },
  {
    icon: 'auto_awesome' as const,
    title: 'AI-репетитор — по желанию',
    text: 'Можно подключить бесплатный ключ Google AI в Профиле — тогда появятся объяснения "почему так", мнемоники и разбор голосовых ответов. Без ключа приложение работает полностью, просто без этого.',
  },
  {
    icon: 'workspace_premium' as const,
    title: 'Четыре раздела внизу',
    text: 'Станции — учить. Экзамен — проверять себя, в том числе таймированно. AI-репетитор — задать вопрос. Профиль — настройки, синхронизация, бэкап.',
  },
];

/**
 * Показывается один раз при первом заходе (до changelog/warmup —
 * см. приоритет в App.tsx). Три коротких экрана вместо падения сразу
 * в список станций с кучей вкладок и режимов.
 */
export function OnboardingModal({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function finish() {
    markOnboardingSeen();
    onDone();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 md:items-center">
      <div className="w-full max-w-md rounded-t-m3-lg bg-surface p-6 md:rounded-m3-lg">
        <div className="mb-5 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-outline-variant'}`} />
          ))}
        </div>

        <div className="mb-5 flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name={current.icon} size={32} />
          </span>
        </div>

        <h2 className="mb-2 text-center text-lg font-semibold">{current.title}</h2>
        <p className="mb-6 text-center text-sm leading-relaxed text-on-surface-variant">{current.text}</p>

        <div className="flex gap-2.5">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="flex-1 rounded-full border border-outline-variant py-2.5 text-sm font-semibold">
              Назад
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setStep((s) => s + 1)}
            className="flex-1 rounded-full bg-primary py-2.5 text-sm font-semibold text-on-primary"
          >
            {isLast ? 'Начать' : 'Далее'}
          </button>
        </div>
        {!isLast && (
          <button onClick={finish} className="mt-3 w-full text-center text-xs text-on-surface-variant underline">
            Пропустить
          </button>
        )}
      </div>
    </div>
  );
}
