import { useState } from 'react';
import { Icon } from '@/components/Icon';

interface Props {
  onBack: () => void;
}

const LS_KEY = 'uziprep.examday.checked';

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: 'Документы',
    items: ['Паспорт', 'СНИЛС', 'Диплом / документ об образовании', 'Направление на аккредитацию (если требуется)', 'Медицинская книжка / справки, если запрашивали'],
  },
  {
    title: 'Логистика',
    items: [
      'Узнал точный адрес и корпус проведения',
      'Проверил маршрут и время в пути с запасом',
      'Знаю, во сколько нужно быть на месте (обычно за 30-60 мин)',
      'Продумал парковку/транспорт заранее',
    ],
  },
  {
    title: 'Перед выходом',
    items: [
      'Телефон заряжен, наличные/карта на такси про запас',
      'Вода и лёгкий перекус',
      'Форма/бахилы, если требуются по регламенту станции',
      'Выспался — не заниматься ночь напролёт перед экзаменом',
    ],
  },
];

function loadChecked(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/**
 * Логистический чек-лист самого экзаменационного дня — не про станции
 * и не про медицину, просто снижает тревожность "а не забыл ли я
 * что-то". Хранится локально (localStorage), синк с Supabase тут не
 * нужен — это разовая штука на конкретный день, не долгосрочный прогресс.
 */
export function ExamDayChecklistScreen({ onBack }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>(loadChecked);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }

  const total = SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2.5">
        <button onClick={onBack} aria-label="Назад" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container">
          <Icon name="arrow_back" size={18} />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Экзаменационный день</h1>
          <p className="text-xs text-on-surface-variant">
            {done} из {total} — организационные мелочи, не медицина
          </p>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">{section.title}</h2>
          {section.items.map((item) => {
            const key = `${section.title}::${item}`;
            return (
              <label key={key} className="flex items-center gap-2.5 border-b border-outline-variant py-2.5 last:border-none">
                <input
                  type="checkbox"
                  checked={!!checked[key]}
                  onChange={() => toggle(key)}
                  className="h-5 w-5 shrink-0 accent-[rgb(var(--m3-primary))]"
                />
                <span className="text-sm">{item}</span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
