/**
 * 7 смысловых категорий, найденные при сравнении ВСЕХ 6 станций (не
 * дословно, а по смыслу действия) — показывает "форму" экзамена ОСКЭ
 * в целом: из каких типовых элементов вообще состоит станция,
 * независимо от того, УЗИ это или коммуникация. Не учебный материал —
 * смотрится один раз для ориентировки, не для зубрёжки.
 */
export interface OskeCategory {
  label: string;
  stationIds: string[]; // какие из 6 станций содержат этот элемент
}

export const OSKE_CATEGORIES: OskeCategory[] = [
  { label: 'Поздороваться', stationIds: ['abdomen', 'echo', 'surface-organs', 'anamnez'] },
  { label: 'Представиться / обозначить роль', stationIds: ['abdomen', 'echo', 'surface-organs', 'anamnez'] },
  { label: 'Спросить ФИО и возраст', stationIds: ['abdomen', 'echo', 'surface-organs'] },
  { label: 'Обратиться по имени-отчеству', stationIds: ['abdomen', 'echo', 'surface-organs', 'consult', 'anamnez'] },
  { label: 'Информировать о процедуре/цели', stationIds: ['abdomen', 'echo', 'surface-organs', 'consult'] },
  { label: 'Обработка рук/датчика после', stationIds: ['abdomen', 'echo', 'surface-organs'] },
  { label: 'Завершение / резюме / прощание', stationIds: ['abdomen', 'echo', 'surface-organs', 'consult', 'anamnez', 'cpr'] },
];
