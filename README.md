# unispace-front

Клиент образовательной платформы Tanym. React 19 + TypeScript + Redux Toolkit (RTK Query) + Tailwind v4, сборка на Vite.

Работает с API из [unispace-back](../unispace-back).

## Запуск

```bash
npm install
npm run dev     # http://localhost:5173
```

Бэкенд должен быть поднят на `http://localhost:4005`. Vite проксирует `/api` на него, поэтому браузер видит один origin — cookie сессии ходит без CORS и без сюрпризов с SameSite. Другой адрес API задаётся переменной `VITE_API_TARGET`.

## Скрипты

- `npm run dev` — dev-сервер
- `npm run build` — продакшн-сборка в `dist/`
- `npm run typecheck` — проверка типов
- `npm run lint` — ESLint

## Структура

```
src/
├── app/           store, типизированные хуки, App с маршрутами, baseApi
├── features/      по модулям: <модуль>Api.ts + компоненты модуля
├── pages/         staff/*, student/*, LoginPage, NotFoundPage
├── layouts/       StaffLayout (сайдбар), StudentLayout (верхнее меню)
└── shared/        ui/ (примитивы), i18n/, types/
```

Эндпоинты не объявляются в `baseApi` напрямую — каждый модуль добавляет свои через `baseApi.injectEndpoints`, поэтому модули независимы. Новый тег кэша обязательно вносится в `API_TAGS` в `app/api/baseApi.ts`, иначе RTK Query упадёт в рантайме.

## Что уже работает

- Вход для сотрудника и студента, восстановление сессии при перезагрузке через `/api/auth/me`
- Глобальная обработка 401 в `baseApi` — разлогинивает и уводит на `/login`
- Переключение языка, словари тянутся с бэка из `src/locales/*.json` (во фронте не дублируются)
- Тосты вместо flash-сообщений Handlebars
- Тёмная тема по системной настройке
- Эталонная страница-справочник — «Специальности»

## Что дальше

План миграции оставшихся модулей: [docs/plans/frontend-migration.md](docs/plans/frontend-migration.md).

Старый репозиторий `../unispace` не трогается и служит источником правды по поведению страниц: вся клиентская логика лежит в inline-`<script>` внутри `src/views/**/*.hbs`.

## Особенности API, о которых надо знать

Поля в ответах приходят с префиксом `out_` (`out_spec_id`, `out_spec_kod`) — так устроены хранимые процедуры PostgreSQL вида `<entity>_full`. Переименовывать их на фронте не нужно.

Часть выборок сделана через `POST`, а не `GET` — например список специальностей это `POST /api/specialties/tb` с телом `{ search, limit, offset }`. В RTK Query это объявляется как `build.query` с `method: 'POST'`, кэширование работает штатно.

Сосуществуют три формата ответа: `{ ok, ... }` у новых эндпоинтов, `{ ok, page, data, ... }` у бывших страничных контроллеров и `{ success, message, data }` у старых CRUD. Типы всех трёх — в `shared/types/api.ts`. Сведение к одному формату — последняя задача плана.
