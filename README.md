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

## Supabase (синхронизация прогресса)

Приложение работает и без Supabase — весь прогресс живёт локально в
IndexedDB. Supabase нужен только для входа по email и синхронизации
между устройствами.

**Настройка (один раз):**

1. Создай проект на [supabase.com](https://supabase.com) (бесплатный план достаточен)
2. Project Settings → API — скопируй `Project URL` и `anon public` ключ
3. SQL Editor → New query — вставь и выполни содержимое `supabase/schema.sql`
   (создаёт таблицу `progress` с RLS: каждый видит только свои строки)
4. Authentication → Providers → Email — включи "Enable email provider"
   и отключи "Confirm email" если хочешь, чтобы magic link работал
   без лишнего шага (по умолчанию Supabase и так шлёт magic link, а не пароль)
5. Authentication → URL Configuration → Redirect URLs — добавь адрес
   своего сайта на GitHub Pages (`https://логин.github.io/uziprep/`),
   иначе ссылка из письма будет вести не туда

**Локально:** скопируй `.env.example` в `.env`, впиши `VITE_SUPABASE_URL`
и `VITE_SUPABASE_ANON_KEY`. `.env` не заливается на GitHub (в `.gitignore`).

**На GitHub Pages:** значения нужно добавить как секреты репозитория —
Settings → Secrets and variables → Actions → New repository secret,
завести `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`. Workflow
(`.github/workflows/deploy.yml`) сам подставит их при сборке. Без
этого шага сайт продолжит работать, просто в локальном режиме —
`ProfileScreen` покажет "Supabase не настроен".

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
