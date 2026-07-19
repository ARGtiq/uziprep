import { describe, it, expect } from 'vitest';
import { compareSteps, compareChecklist, getExamOrderingSteps } from '@/lib/scenarioComparison';
import type { StationScenario } from '@/types/station';

function scenario(name: string, texts: string[]): StationScenario {
  return {
    name,
    steps: texts,
    stepBlocks: [{ block: 'Блок', items: texts.map((t, i) => ({ num: String(i + 1), text: t })) }],
    checklist: [{ block: 'Блок', items: texts }],
  };
}

describe('compareSteps', () => {
  it('находит общие шаги между сценариями', () => {
    const a = scenario('A', ['Здороваться', 'Мыть руки', 'Специфика A']);
    const b = scenario('B', ['Здороваться', 'Мыть руки', 'Специфика B']);
    const { common, perScenario } = compareSteps([a, b]);
    expect(common.map((s) => s.text)).toEqual(['Здороваться', 'Мыть руки']);
    expect(perScenario[0].unique.map((s) => s.text)).toEqual(['Специфика A']);
    expect(perScenario[1].unique.map((s) => s.text)).toEqual(['Специфика B']);
  });

  it('при одном сценарии не считает ничего общим', () => {
    const a = scenario('A', ['Раз', 'Два']);
    const { common, perScenario } = compareSteps([a]);
    expect(common).toEqual([]);
    expect(perScenario[0].unique.map((s) => s.text)).toEqual(['Раз', 'Два']);
  });
});

describe('compareChecklist', () => {
  it('находит общие пункты чек-листа с сохранением блоков', () => {
    const a = scenario('A', ['Общий пункт', 'Пункт A']);
    const b = scenario('B', ['Общий пункт', 'Пункт B']);
    const { common } = compareChecklist([a, b]);
    expect(common[0].items).toEqual(['Общий пункт']);
  });
});

describe('getExamOrderingSteps', () => {
  it('возвращает null, если общее ядро длиннее порога', () => {
    const longSteps = Array.from({ length: 25 }, (_, i) => `Шаг ${i}`);
    const a = scenario('A', longSteps);
    const b = scenario('B', longSteps); // все шаги общие -> common.length = 25 > 20
    const station = { steps: longSteps, scenarios: [a, b] };
    expect(getExamOrderingSteps(station)).toBeNull();
  });

  it('возвращает шаги напрямую для короткой станции без сценариев', () => {
    const steps = ['Раз', 'Два', 'Три'];
    expect(getExamOrderingSteps({ steps })).toEqual(steps);
  });
});
