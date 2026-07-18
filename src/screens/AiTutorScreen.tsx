export function AiTutorScreen() {
  const suggestions = [
    'Как считать ФВ ЛЖ по Симпсону?',
    'Расскажи алгоритм БСЛР 30:2',
    'Ошибки при УЗИ щитовидной железы',
  ];
  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">AI-репетитор</h1>
      <p className="mb-4 text-sm text-on-surface-variant">
        Спросите об алгоритме, критериях оценки или разберите ошибки.
      </p>
      {suggestions.map((s) => (
        <div key={s} className="mb-2 cursor-pointer rounded-m3-md bg-surface-container-low p-3.5 text-sm">
          {s}
        </div>
      ))}
    </div>
  );
}
