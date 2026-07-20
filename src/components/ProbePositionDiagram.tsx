/**
 * Оригинальные схематичные иллюстрации (не копии реальных медицинских
 * изображений/учебников — простой силуэт + датчик + стрелка,
 * нарисованы нами) позиции датчика для ключевых сценариев. Текст +
 * образ вместе (dual coding) запоминается надёжнее, чем только текст,
 * особенно для пространственных вещей вроде "куда ставить датчик".
 *
 * Ключ подбирается по совпадению подстроки в названии сценария —
 * не претендует на покрытие всех случаев, только самые частые.
 */
type DiagramKey = 'abdomen-ruq' | 'abdomen-flank' | 'echo-parasternal' | 'echo-apical' | 'thyroid';

const KEYWORD_MAP: [RegExp, DiagramKey][] = [
  [/печен/i, 'abdomen-ruq'],
  [/поджелудочн/i, 'abdomen-ruq'],
  [/почк/i, 'abdomen-flank'],
  [/парастернальн/i, 'echo-parasternal'],
  [/апикальн/i, 'echo-apical'],
  [/щитовидн/i, 'thyroid'],
];

export function findDiagramKey(scenarioName: string): DiagramKey | null {
  for (const [re, key] of KEYWORD_MAP) {
    if (re.test(scenarioName)) return key;
  }
  return null;
}

function BodySilhouette() {
  return (
    <path
      d="M100 20 a18 18 0 1 1 0 36 a18 18 0 1 1 0 -36 M70 60 q30 -12 60 0 l6 90 q-15 10 -36 10 t-36 -10 z"
      fill="rgb(var(--m3-outline-variant))"
    />
  );
}

function ProbeArrow({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <rect x={-6} y={-22} width={12} height={22} rx={4} fill="rgb(var(--m3-primary))" />
      <path d="M0 6 L-14 26 L14 26 Z" fill="rgb(var(--m3-primary))" opacity={0.5} />
    </g>
  );
}

const DIAGRAMS: Record<DiagramKey, { title: string; render: () => JSX.Element }> = {
  'abdomen-ruq': {
    title: 'Правое подреберье — печень/поджелудочная',
    render: () => (
      <>
        <BodySilhouette />
        <ProbeArrow x={122} y={82} angle={20} />
      </>
    ),
  },
  'abdomen-flank': {
    title: 'Боковой доступ — почки',
    render: () => (
      <>
        <BodySilhouette />
        <ProbeArrow x={135} y={110} angle={70} />
      </>
    ),
  },
  'echo-parasternal': {
    title: 'Парастернальный доступ — слева от грудины',
    render: () => (
      <>
        <BodySilhouette />
        <ProbeArrow x={92} y={78} angle={-10} />
      </>
    ),
  },
  'echo-apical': {
    title: 'Апикальный доступ — область верхушки сердца',
    render: () => (
      <>
        <BodySilhouette />
        <ProbeArrow x={95} y={110} angle={30} />
      </>
    ),
  },
  thyroid: {
    title: 'Передняя поверхность шеи',
    render: () => (
      <>
        <BodySilhouette />
        <ProbeArrow x={100} y={38} angle={0} />
      </>
    ),
  },
};

export function ProbePositionDiagram({ diagramKey }: { diagramKey: DiagramKey }) {
  const diagram = DIAGRAMS[diagramKey];
  return (
    <div className="mb-4 rounded-m3-md bg-surface-container-low p-3">
      <svg viewBox="0 0 200 180" className="mx-auto h-36 w-auto">
        {diagram.render()}
      </svg>
      <p className="mt-1 text-center text-xs text-on-surface-variant">{diagram.title}</p>
      <p className="text-center text-[10px] text-on-surface-variant opacity-70">Схематично, не анатомически точно</p>
    </div>
  );
}
