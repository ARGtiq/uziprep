import { useEffect, useState } from 'react';
import { getCharacter, saveCharacter, hasCharacter, levelFromXp, tierFromLevel, TIER_LABEL, CLASS_META, type CharacterData } from '@/lib/character';
import { getAllXp, getStreak } from '@/lib/streakAndXp';
import { CharacterAvatar } from '@/components/CharacterAvatar';
import { CharacterCreationModal } from '@/components/CharacterCreationModal';
import { getAggregateStats, type AggregateStats } from '@/lib/statsAggregate';
import { useLiveQuery } from 'dexie-react-hooks';
import { listExamAttempts } from '@/lib/db';
import { ExamHistoryChart } from '@/components/ExamHistoryChart';
import { Icon } from '@/components/Icon';

interface Achievement {
  id: string;
  label: string;
  icon: any;
  unlocked: boolean;
  hint: string;
}

function buildAchievements(stats: AggregateStats): Achievement[] {
  return [
    { id: 'streak-3', label: 'Три дня подряд', icon: 'schedule', unlocked: stats.streakDays >= 3, hint: '3+ дня подряд без пропуска' },
    { id: 'streak-7', label: 'Неделя без пропусков', icon: 'schedule', unlocked: stats.streakDays >= 7, hint: '7+ дней подряд' },
    { id: 'blocks-10', label: 'Десять блоков освоено', icon: 'check_circle', unlocked: stats.masteredBlocksCount >= 10, hint: '10+ блоков с уровнем мастерства 3+' },
    { id: 'exams-5', label: 'Пять попыток экзамена', icon: 'workspace_premium', unlocked: stats.examAttemptsCount >= 5, hint: '5+ пройденных попыток' },
    { id: 'questions-50', label: 'Полсотни вопросов', icon: 'refresh', unlocked: stats.questionsAnswered >= 50, hint: '50+ отвеченных вопросов' },
    { id: 'mnemonics-3', label: 'Собиратель мнемоник', icon: 'auto_awesome', unlocked: stats.mnemonicsCount >= 3, hint: '3+ сохранённые мнемоники' },
    { id: 'score-80', label: 'Высокий балл', icon: 'workspace_premium', unlocked: (stats.avgScorePercent ?? 0) >= 80, hint: 'Средний результат экзамена 80%+' },
  ];
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-m3-md bg-surface-container-low p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <div className="text-lg font-semibold leading-none">{value}</div>
        <div className="text-xs text-on-surface-variant">{label}</div>
      </div>
    </div>
  );
}

/**
 * Персонаж и статистика раньше были двумя разными экранами, отвечающими
 * на один и тот же вопрос "как у меня дела" — просто разными единицами
 * (аватар/уровень vs голые цифры). Объединено в один блок без перехода
 * между ними. Живёт как вкладка внутри Профиля, не отдельный экран —
 * своего заголовка/кнопки назад не имеет.
 */
export function CharacterAndStats() {
  const [character, setCharacter] = useState<CharacterData | null>(getCharacter);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const chartAttempts = useLiveQuery(() => listExamAttempts(20), [], []) ?? [];

  useEffect(() => {
    getAggregateStats().then(setStats);
  }, []);

  if (!hasCharacter() || !character) {
    return <CharacterCreationModal onDone={() => setCharacter(getCharacter())} />;
  }

  const totalXp = Object.values(getAllXp()).reduce((a, b) => a + b, 0);
  const { level, xpIntoLevel, xpForNextLevel } = levelFromXp(totalXp);
  const tier = tierFromLevel(level);
  const streak = getStreak();

  function saveName() {
    const trimmed = nameDraft.trim() || 'Без имени';
    const updated = { ...character!, name: trimmed };
    saveCharacter(updated);
    setCharacter(updated);
    setEditingName(false);
  }

  const achievements = stats ? buildAchievements(stats) : [];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div>
      <div className="mb-4 flex flex-col items-center rounded-m3-md bg-surface-container-low p-5 text-center">
        <CharacterAvatar characterClass={character.class} tier={tier} size={100} />

        {editingName ? (
          <div className="mt-3 flex w-full max-w-[220px] gap-2">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={24}
              className="flex-1 rounded-m3-sm border border-outline-variant bg-surface px-2 py-1.5 text-sm"
              autoFocus
            />
            <button onClick={saveName} className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary">
              ОК
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setNameDraft(character.name);
              setEditingName(true);
            }}
            className="mt-3 flex items-center gap-1 text-lg font-semibold"
          >
            {character.name}
            <Icon name="auto_awesome" size={14} className="text-on-surface-variant" />
          </button>
        )}

        <div className="text-xs text-on-surface-variant">
          {CLASS_META[character.class].label} · {TIER_LABEL[tier]} · уровень {level}
        </div>

        <div className="mt-3 w-full max-w-[220px]">
          <div className="mb-1 flex justify-between text-[11px] text-on-surface-variant">
            <span>{xpIntoLevel} XP</span>
            <span>{xpForNextLevel} XP</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(xpIntoLevel / xpForNextLevel) * 100}%` }} />
          </div>
        </div>

        {streak.count > 0 && (
          <div className="mt-2 text-xs text-on-surface-variant">
            🔥 {streak.count} {streak.count === 1 ? 'день' : 'дня'} подряд
          </div>
        )}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">
        Достижения ({unlockedCount}/{achievements.length})
      </h2>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`flex flex-col items-center gap-1.5 rounded-m3-md p-3 text-center ${
              a.unlocked ? 'bg-primary-container' : 'bg-surface-container-low opacity-50'
            }`}
          >
            <Icon name={a.icon} size={22} className={a.unlocked ? 'text-on-primary-container' : 'text-on-surface-variant'} />
            <div className={`text-xs font-semibold ${a.unlocked ? 'text-on-primary-container' : ''}`}>{a.label}</div>
            <div className="text-[10px] text-on-surface-variant">{a.hint}</div>
          </div>
        ))}
      </div>

      {stats && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-on-surface-variant">Статистика</h2>
          <div className="mb-2 grid grid-cols-2 gap-2.5">
            <StatCard icon="schedule" label="Дней подряд" value={String(stats.streakDays)} />
            <StatCard icon="check_circle" label="Попыток экзамена" value={String(stats.examAttemptsCount)} />
            <StatCard icon="workspace_premium" label="Средний результат" value={stats.avgScorePercent !== null ? `${stats.avgScorePercent}%` : '—'} />
            <StatCard icon="schedule" label="Часов тренировок" value={String(stats.trainingHours)} />
            <StatCard icon="refresh" label="Вопросов отвечено" value={String(stats.questionsAnswered)} />
            <StatCard icon="cancel" label="Ошибок всего" value={String(stats.questionsWrongTotal)} />
            <StatCard icon="compare" label="Освоено блоков" value={`${stats.masteredBlocksCount} / ${stats.totalBlocksTracked}`} />
            <StatCard icon="auto_awesome" label="Мнемоник сохранено" value={String(stats.mnemonicsCount)} />
          </div>

          {chartAttempts.length > 1 && (
            <div className="mt-4">
              <ExamHistoryChart attempts={[...chartAttempts].reverse()} />
            </div>
          )}

          <p className="mt-2 text-xs text-on-surface-variant">
            "Часов тренировок" — приближённая оценка по длительности попыток экзамена, не точный трекер времени на все виды тренировки.
          </p>
        </>
      )}
    </div>
  );
}
