import { useState } from 'react';
import { STATIONS } from '@/data/stations';
import { getPlanProgress, setPlanStepDone } from '@/lib/studyPlan';
import { IconBadge } from '@/components/IconBadge';
import { Icon } from '@/components/Icon';

interface PlanStep {
  id: string;
  title: string;
  desc: string;
  action?: { label: string; kind: 'uzi-ritual' | 'oske-structure' | 'action-pattern' | 'station'; stationId?: string };
}

const STEPS: PlanStep[] = [
  {
    id: 'uzi-ritual',
    title: '1. УЗИ-ритуал',
    desc: '10 пунктов дословно одинаковых во всех трёх УЗИ-станциях — выучи один раз, закрывает начало и конец сразу трёх станций.',
    action: { label: 'Открыть', kind: 'uzi-ritual' },
  },
  {
    id: 'oske-structure',
    title: '2. Форма экзамена целиком',
    desc: 'Гигиена рук/датчика и идентификация пациента — не техника навыка, а стандарт безопасности, проверяется почти всегда. Посмотри, как устроен ОСКЭ вообще.',
    action: { label: 'Открыть', kind: 'oske-structure' },
  },
  {
    id: 'action-pattern',
    title: '3. Грамматика действий',
    desc: '~80% "рабочей" части УЗИ-станций — это 12 глаголов трёх типов (измерение/визуализация/оценка). Пойми паттерн, прежде чем зубрить.',
    action: { label: 'Открыть', kind: 'action-pattern' },
  },
  ...STATIONS.filter((s) => s.id !== 'cpr').map((s, i) => ({
    id: `station-${s.id}`,
    title: `4.${i + 1}. ${s.title}`,
    desc: 'Специфика органа/сценария — тут уже нет "лайфхака", реальный объём. Учи через "Полный план" станции.',
    action: { label: 'Открыть станцию', kind: 'station' as const, stationId: s.id },
  })),
  {
    id: 'station-cpr',
    title: '5. БСЛР',
    desc: 'Единственная станция без переиспользования с остальными — учи целиком, без срезов.',
    action: { label: 'Открыть станцию', kind: 'station', stationId: 'cpr' },
  },
];

interface Props {
  onOpenUziRitual: () => void;
  onOpenOskeStructure: () => void;
  onOpenActionPattern: () => void;
  onOpenStation: (stationId: string) => void;
}

/**
 * Пошаговый план изучения — порядок по убыванию отдачи на единицу
 * усилий (обсуждали в переписке): сначала то, что переиспользуется
 * между станциями, потом форма экзамена в целом, потом грамматика
 * действий, и только затем органоспецифика по одной станции — там
 * уже нет способа сжать материал, только время.
 */
export function StudyPlanScreen({ onOpenUziRitual, onOpenOskeStructure, onOpenActionPattern, onOpenStation }: Props) {
  const [progress, setProgress] = useState<Record<string, boolean>>(getPlanProgress);
  const doneCount = STEPS.filter((s) => progress[s.id]).length;

  function toggle(id: string) {
    setProgress((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setPlanStepDone(id, next[id]);
      return next;
    });
  }

  function runAction(step: PlanStep) {
    if (!step.action) return;
    if (step.action.kind === 'uzi-ritual') onOpenUziRitual();
    else if (step.action.kind === 'oske-structure') onOpenOskeStructure();
    else if (step.action.kind === 'action-pattern') onOpenActionPattern();
    else if (step.action.kind === 'station' && step.action.stationId) onOpenStation(step.action.stationId);
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">С чего начать</h1>
      <p className="mb-4 text-sm text-on-surface-variant">
        Порядок по убыванию отдачи — сначала то, что переиспользуется между станциями, потом органоспецифика. {doneCount}/{STEPS.length} отмечено.
      </p>

      <div className="flex flex-col gap-2.5">
        {STEPS.map((step) => {
          const done = !!progress[step.id];
          const station = step.action?.stationId ? STATIONS.find((s) => s.id === step.action!.stationId) : null;
          return (
            <div key={step.id} className={`rounded-m3-md p-3.5 ${done ? 'bg-primary-container/40' : 'bg-surface-container-low'}`}>
              <div className="flex items-start gap-2.5">
                <button onClick={() => toggle(step.id)} aria-label={done ? 'Снять отметку' : 'Отметить пройденным'} className="mt-0.5 shrink-0">
                  <Icon name={done ? 'check_circle' : 'schedule'} size={20} className={done ? 'text-primary' : 'text-on-surface-variant opacity-50'} />
                </button>
                <div className="flex-1">
                  <b className={`text-sm ${done ? 'line-through opacity-60' : ''}`}>{step.title}</b>
                  <p className="mt-0.5 text-xs text-on-surface-variant">{step.desc}</p>
                  {step.action && (
                    <button onClick={() => runAction(step)} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      {station && <IconBadge icon={station.icon as any} colorKey={station.id} size="sm" />}
                      {step.action.label} <Icon name="arrow_forward" size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
