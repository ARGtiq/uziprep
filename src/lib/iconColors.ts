/**
 * Фиксированные цвета для "разноцветного" режима иконок — по одному
 * заметному цвету на станцию/режим, как в референсе (не по одному
 * приглушённому оттенку темы для всех). Список конечный и явный,
 * а не сгенерированный из seed-цвета — нам важно, чтобы цвета были
 * легко различимы между собой, а не гармоничны с темой.
 */
const STATION_COLORS: Record<string, string> = {
  abdomen: '#2F80ED', // синий
  echo: '#EB5757', // красный
  'surface-organs': '#17A398', // бирюзовый
  consult: '#9B51E0', // фиолетовый
  anamnez: '#F2994A', // оранжевый
  cpr: '#EC5AA0', // розовый/пурпурный
};

const MODE_COLORS: Record<string, string> = {
  mixed: '#2F80ED',
  'mixed-studied': '#17A398',
  fever: '#EB5757',
  nonstop: '#27AE60',
  'wrong-only': '#F2994A',
  challenge: '#EB5757',
  'core-diff': '#9B51E0',
  'find-error': '#F2994A',
  occlusion: '#56CCF2',
  voice: '#9B51E0',
  'ordering-pick': '#2F80ED',
  examday: '#27AE60',
};

const FALLBACK_PALETTE = ['#2F80ED', '#EB5757', '#17A398', '#9B51E0', '#F2994A', '#27AE60', '#EC5AA0', '#56CCF2'];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Возвращает hex-цвет для ключа (id станции или режима). Неизвестные ключи получают стабильный цвет по хэшу, а не случайный при каждом рендере. */
export function getIconColor(key: string): string {
  return STATION_COLORS[key] ?? MODE_COLORS[key] ?? FALLBACK_PALETTE[hashString(key) % FALLBACK_PALETTE.length];
}
