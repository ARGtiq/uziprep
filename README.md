# UziPrep

PWA для подготовки к первичной аккредитации по УЗИ.

## Деплой на GitHub Pages

Base path в `vite.config.ts` (`base: '/uziprep/'`) должен совпадать с
именем репозитория — поменяй перед первым деплоем, либо на `/`, если
это корневой репо `username.github.io`.

**Вариант А — вручную одной командой:**

```bash
npm run deploy
```

Собирает и пушит `dist/` в ветку `gh-pages` (пакет `gh-pages`).
В Settings → Pages → Source выбрать "Deploy from a branch" → `gh-pages`.

**Вариант Б — автоматически при каждом `git push` (рекомендую):**

Уже настроен `.github/workflows/deploy.yml`. В Settings → Pages → Source
выбрать "GitHub Actions". После этого просто `git push` в `main` —
сборка и выкладка происходят на серверах GitHub, локально ничего
собирать не нужно.

## Запуск

```bash
npm install
npm run dev
```

Открыть `http://localhost:5173`.

## Продакшн-сборка (с PWA/service worker)

```bash
npm run build
npm run preview
```

## Архитектура темизации (Material You)

`src/theme/` — заменяемый слой цвета:

- `palette.types.ts` — контракт `M3Palette` / `ThemeSource`. Всё
  приложение общается только с этим интерфейсом.
- `sources/seedSource.ts` — текущий источник: полная M3 tonal-палитра
  генерируется из одного seed-цвета через `material-color-utilities`.
  Работает одинаково в браузере, PWA, WebView.
- `sources/androidDynamicSource.ts` — заготовка под нативный
  Material You "от обоев" (Android 12+). Ждёт `window.AndroidTheme`
  — JS-мост из будущей Kotlin-обёртки (аналог `GaripovBridge`),
  который должен вернуть JSON вида `M3Palette`. Пока моста нет —
  тихо откатывается на seed.
- `applyPalette.ts` — единственное место, которое пишет CSS-переменные
  `--m3-*`. Tailwind-конфиг маппит цвета Tailwind (`bg-primary`,
  `text-on-surface` и т.д.) на эти переменные через `rgb(var(--m3-x) / <alpha>)`.
- `ThemeProvider.tsx` — React-контекст, переключатель источника/режима,
  сохранение выбора в `localStorage`.

Чтобы добавить нативный мост: в Kotlin-WebView добавить
`@JavascriptInterface fun getDynamicColors(mode: String): String`,
вернуть JSON с полями `M3Palette` (camelCase), подставить в
`window.AndroidTheme`. Веб-код менять не нужно — просто переключить
источник на `android-dynamic` в профиле.

## Данные станций

`src/data/stations.ts` — структурированные данные, вытащенные из
паспортов ОСКЭ (`13. Алгоритм выполнения навыка` → `steps`,
`14. Оценочный лист` → `checklist`). При добавлении новых паспортов
— просто новый объект `Station` в массив `STATIONS`.

## Офлайн-хранилище

`src/lib/db.ts` — Dexie (IndexedDB). Прогресс чек-листов и результаты
тренировки порядка действий пишутся локально всегда, плюс кладутся в
`syncQueue` для последующей фоновой синхронизации с Supabase (ещё не
подключена — следующий шаг).

## Режим "Собери последовательность"

`src/components/StepOrderingGame.tsx` — HTML5 drag-and-drop карточек
шагов станции в случайном порядке + кнопки вверх/вниз как fallback
для мобильных (нативный DnD на тач-устройствах нестабилен).
Используется и в детальной странице станции (таб "Тренировка порядка"),
и в разделе "Экзамен" (по всем станциям с достаточным числом шагов).
