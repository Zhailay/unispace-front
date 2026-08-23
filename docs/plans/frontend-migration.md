# Plan: Перенос фронтенда Tanym с Handlebars на React

Бэкенд `unispace-back` отдаёт JSON по `/api/*` и остаётся неизменным: контроллеры писались под AJAX, а немногие оставшиеся `res.render`/`res.redirect` превращаются в JSON слоем совместимости `src/middlewares/apiCompat.js`. Задача фронта — воспроизвести 30 hbs-шаблонов (11 400 строк разметки и ~5 850 строк inline-JS) на React + TypeScript + Redux Toolkit (RTK Query) + Tailwind v4.

Каркас уже собран: store, baseApi с обработкой 401, авторизация, i18n через `/api/lang/translations`, два layout'а, тосты вместо flash-сообщений и эталонная страница-справочник `SpecialtiesPage`. Дальше — модуль за модулем по этому образцу. Оригинальная вёрстка и вся клиентская логика лежат в старом репозитории `d:\PetPjjrojects\unispace\src\views\` — это источник правды по поведению каждой страницы; сверяться с ним обязательно, придумывать поведение заново нельзя.

**Локальная база.** Разработка идёт против копии в Docker, не против боевого сервера. Контейнер `unispace-pg` (том `unispace-pgdata`), порт **5433**, восстановлен из дампа от 23.08.2026: 74 таблицы, 140 функций, данные на месте. `unispace-back/.env` уже настроен на неё. Поднять после перезагрузки: `docker start unispace-pg`. Тестовые аккаунты — сотрудники `111` и `222`, студенты `333` и `444`, пароль у всех `password123` (задан локально; в боевой базе пароли другие).

**Правило, обязательное для каждой задачи.** Имена полей в ответах API нельзя выводить по догадке — только сверять с реальным ответом. `tsc` проверяет, что поле есть в объявленном интерфейсе, но не то, что оно есть в ответе сервера: выдуманное поле проходит сборку и молча рендерится как `undefined`. Так уже была допущена ошибка — `out_spec_name` не существует, процедура отдаёт `out_spec_kz`, `out_spec_ru` и `out_spec_en` отдельными колонками. Перед описанием типов модуля запускать:

```bash
node scripts/api-fields.mjs /<путь эндпоинта>
```

И второе: **все `*_id` приходят строками, а не числами** — драйвер `pg` отдаёт `bigint` как string, потому что 64-битное целое не помещается в JS number. Использовать тип `Id` из `shared/types/api.ts`. Не писать `id === 10` и не пропускать идентификаторы через `parseInt`.

## Validation Commands
- `npm --prefix d:/PetPjjrojects/unispace-front run typecheck`
- `npm --prefix d:/PetPjjrojects/unispace-front run lint`
- `npm --prefix d:/PetPjjrojects/unispace-front run build`
- `node --check d:/PetPjjrojects/unispace-back/src/server.js`
- `node d:/PetPjjrojects/unispace-front/scripts/api-fields.mjs`

### Task 1: Запустить связку фронт + бэк
- [x] `npm install` в `unispace-back`, `npm install` в `unispace-front`
- [x] Проверить, что `unispace-back/.env` содержит `PORT=4005` и `CORS_ORIGIN=http://localhost:5173`
- [x] Поднять бэк (`npm run dev`) и убедиться, что `GET /api/health` отвечает `{ ok: true }` (manual test - skipped, not automatable)
- [x] Поднять фронт (`npm run dev`), войти сотрудником и студентом, проверить что после F5 сессия восстанавливается через `/api/auth/me` (manual test - skipped, not automatable)
- [x] Проверить переключение языка: словарь приходит с `/api/lang/translations`, заголовок `X-Lang` уходит на бэк (manual test - skipped, not automatable)
- [x] Убедиться, что `npm run build` и `npm run typecheck` проходят без ошибок

### Task 2: Общие UI-компоненты
- [x] `shared/ui/DataTable.tsx` — таблица с колонками-описателями, состояниями загрузки и пустого списка, горизонтальным скроллом (`.table-scroll`)
- [x] `shared/ui/Modal.tsx` — диалог на нативном `<dialog>`, закрытие по Esc и клику вне, возврат фокуса
- [x] `shared/ui/Pagination.tsx` — вынести пагинацию из `SpecialtiesPage`
- [x] `shared/ui/ConfirmDialog.tsx` — подтверждение удаления вместо `confirm()` из hbs
- [x] `shared/hooks/useDebouncedValue.ts` — для поиска, чтобы не дёргать бэк на каждый символ
- [x] `shared/ui/CascadeSelect.tsx` — связанные списки семестр → дисциплина → группа → неделя; каждый следующий блокируется, пока не выбран предыдущий
- [x] Переписать `SpecialtiesPage` на `DataTable` + `Pagination`, поведение не меняя

### Task 3: Справочники — формы создания и редактирования
- [x] `features/specialties/SpecialtyForm.tsx`: поля `spec_kod`, `spec_kz`, `spec_ru`, `spec_en`, выбор `id_gruppa_op` из `gruppaOpList`
- [x] Подключить `useCreateSpecialtyMutation` и `useUpdateSpecialtyMutation`, показывать `message` из ответа тостом
- [x] Обработать `out_code === 2` (дубликат) отдельным текстом ошибки
- [x] Сверить состав полей и валидацию с `unispace/src/views/ucheb/specialties.hbs`
- [x] Убедиться, что после мутации список перезапрашивается по тегу `Specialty`

### Task 4: Модуль «Группы ОП» (gruppa_op)
- [ ] `features/gruppaOp/gruppaOpApi.ts` — эндпоинты из `unispace-back/src/routes/gruppa_op.js`
- [ ] `pages/staff/GruppaOpPage.tsx` по образцу `SpecialtiesPage`
- [ ] Сверить с `unispace/src/views/ucheb/gruppa_op.hbs` (637 строк)
- [ ] Добавить маршрут в `app/App.tsx` и пункт в `NAV` в `layouts/StaffLayout.tsx`

### Task 5: Модуль «Группы» (gruppa)
- [ ] `features/gruppa/gruppaApi.ts` — эндпоинты из `routes/gruppa.js`
- [ ] `pages/staff/GruppaPage.tsx`, каскад справочников (специальность, форма обучения, год, курс)
- [ ] Сверить с `unispace/src/views/ucheb/gruppa.hbs` (669 строк)
- [ ] Маршрут и пункт меню

### Task 6: Модуль «Студенты» (students)
- [ ] `features/students/studentsApi.ts` — 7 эндпоинтов из `routes/students.js`
- [ ] `pages/staff/StudentsPage.tsx`: поиск, пагинация, карточка студента, перевод между группами
- [ ] Сверить с `unispace/src/views/ucheb/students.hbs` — самый большой шаблон, 1086 строк
- [ ] Маршрут и пункт меню

### Task 7: Модули «Дисциплины», «Модули», «Общие названия»
- [ ] `features/disciplina/disciplinaApi.ts` + `pages/staff/DisciplinaPage.tsx` (`disciplina.hbs`, 597 строк)
- [ ] `features/modulName/modulNameApi.ts` + `pages/staff/ModulNamePage.tsx` (`modul_name.hbs`, 455 строк)
- [ ] `features/obshName/obshNameApi.ts` + `pages/staff/ObshNamePage.tsx` (`obsh_name.hbs`, 421 строка)
- [ ] Маршруты и пункты меню для всех трёх

### Task 8: Модуль «Календарь» (kalendar)
- [ ] `features/kalendar/kalendarApi.ts` — эндпоинты из `routes/kalendar.js`
- [ ] `pages/staff/KalendarPage.tsx` — сетка учебных недель, привязка к периодам обучения
- [ ] Сверить с `unispace/src/views/ucheb/kalendar.hbs` (569 строк)
- [ ] Маршрут и пункт меню

### Task 9: Модуль «Учебный план» (plan)
- [ ] `features/plan/planApi.ts` — 7 эндпоинтов из `routes/plan.js`
- [ ] `pages/staff/PlanPage.tsx` — план по семестрам, виды занятий, формы контроля
- [ ] Сверить с `unispace/src/views/ucheb/plan.hbs` (797 строк)
- [ ] Маршрут и пункт меню

### Task 10: Модуль «Регистрация» (registraciya)
- [ ] `features/registraciya/registraciyaApi.ts` — 8 эндпоинтов из `routes/registraciya.js`
- [ ] `pages/staff/RegistraciyaPage.tsx` — привязка студентов к плану
- [ ] Сверить с `unispace/src/views/ucheb/registraciya.hbs` (404 строки)
- [ ] Маршрут и пункт меню

### Task 11: Модуль «Журнал» (jurnal) — ключевой
- [ ] `features/jurnal/jurnalApi.ts` — 13 эндпоинтов из `routes/jurnal.js`
- [ ] Каскад семестр → группа → неделя → день на `CascadeSelect`
- [ ] Сетка оценок: редактируемые ячейки, отметка пропуска, комментарий
- [ ] Пакетное сохранение через `/api/jurnal/save` — параллельные массивы, как ожидает `jurnal_save`
- [ ] Отдельные виды: текущий контроль, практика, итоговый, экзамен, Р1/Р2 (`/tk`, `/praktika`, `/itog`, `/exam-students`, `/r1-students`, `/r2-students`)
- [ ] Сверить с `unispace/src/views/ucheb/jurnal.hbs` (921 строка) — самая сложная клиентская логика
- [ ] Маршрут и пункт меню

### Task 12: Модуль «Внеплановое» (vneplanovoe)
- [ ] `features/vneplanovoe/vneplanovoeApi.ts` — 10 эндпоинтов из `routes/vneplanovoe.js`
- [ ] `pages/staff/VneplanovoePage.tsx` — пересдачи, теоретическая часть и экзамен
- [ ] Сверить с `unispace/src/views/ucheb/vneplanovoe.hbs` (391 строка)
- [ ] Маршрут и пункт меню

### Task 13: Модуль «Загрузка тестов» (test_upload)
- [ ] `features/testUpload/testUploadApi.ts` — 15 эндпоинтов из `routes/test_upload.js`
- [ ] Загрузка RTF через `FormData` с индикатором прогресса (`XMLHttpRequest`, RTK Query прогресс не отдаёт)
- [ ] Экран предпросмотра распарсенных вопросов (`test_upload/preview.hbs`)
- [ ] Экран управления вопросами с пагинацией, включением/отключением, правкой ответов (`test_upload/manage.hbs`, 393 строки)
- [ ] Настройки теста и расписание по группам
- [ ] Учесть, что распарсенные вопросы живут в сессии между `/parse` и `/save` — вкладку нельзя терять
- [ ] Маршрут и пункт меню

### Task 14: Кадровый модуль (kadr)
- [ ] `features/kadr/kadrApi.ts` — 12 эндпоинтов из `routes/kadr.js`
- [ ] `pages/staff/DepartmentsPage.tsx`, `PositionsPage.tsx`, `EmployeesPage.tsx`
- [ ] Сверить с `unispace/src/views/kadr/*.hbs`
- [ ] Маршруты и пункты меню

### Task 15: Профили и дашборды
- [ ] `pages/staff/StaffProfilePage.tsx` и `pages/student/StudentProfilePage.tsx` со сменой пароля через `/api/staff` и `/api/student`
- [ ] Наполнить `StaffDashboardPage` данными из `/api/dashboard` (`dashboard/staff.hbs`, 315 строк)
- [ ] Наполнить `StudentDashboardPage` данными из `/api/dashboard` (`dashboard/student.hbs`, 497 строк)
- [ ] Проверить, что смена пароля разлогинивает и возвращает на `/login`

### Task 16: Чистка бэкенда после переноса
- [ ] Найти контроллеры, где не осталось вызовов `res.render`/`res.redirect`
- [ ] Переписать оставшиеся на явный `res.json({ ok, data })`
- [ ] Свести старый формат `{ success, message, data }` к `{ ok, error, data }`, обновив соответствующие `features/*/api.ts`
- [ ] Когда `grep -rn "res.render\|res.redirect" src/controllers` в `unispace-back` ничего не найдёт — удалить `src/middlewares/apiCompat.js` и его подключение в `server.js`
- [ ] Удалить из `shared/types/api.ts` типы `PageResponse` и `LegacyResponse`

### Task 17: Сборка и деплой
- [ ] Настроить отдачу `dist/` фронта: nginx/IIS перед бэком либо `express.static` в `unispace-back`
- [ ] Для кросс-доменного варианта проверить `sameSite: 'none'` + `secure: true` в сессии и `CORS_ORIGIN` с боевым доменом
- [ ] Настроить SPA-fallback: все не-`/api` пути отдают `index.html`
- [ ] Проверить продовую сборку целиком: вход, журнал, загрузка RTF

---

## Архитектурные детали

### Структура фронта

```
src/
├── app/           store.ts, hooks.ts, App.tsx, api/baseApi.ts
├── features/      по модулям: <модуль>Api.ts (injectEndpoints) + компоненты
├── pages/         staff/*, student/*, LoginPage, NotFoundPage
├── layouts/       StaffLayout, StudentLayout
└── shared/        ui/, i18n/, types/, hooks/
```

Эндпоинты не пишутся в `baseApi` напрямую — каждый модуль добавляет свои через `baseApi.injectEndpoints`, поэтому модули не зависят друг от друга.

### Соглашения бэкенда, которые важны фронту

**Хранимые процедуры вместо ORM.** Вся логика в функциях PostgreSQL. Два шаблона:

- `<entity>_full(p_command, ...)` — CRUD-диспетчер. `p_command`: 1 = INSERT, 2 = UPDATE, 3 = DELETE, 4 = SELECT. Возвращает колонки с префиксом `out_` (`out_spec_id`, `out_code`). `out_code`: 1 — успех, 2 — дубликат.
- `<entity>_spisok(yazyk_id)` — списки для выпадающих меню.

Из-за префикса `out_` поля в ответах выглядят как `out_spec_kod`, а не `code`. Переименовывать их на фронте не нужно — типы описываются как есть (см. `SpecialtyRow`).

**Многоязычные справочники хранят три колонки, а не одну.** Процедуры `*_full` возвращают `out_<entity>_kz`, `out_<entity>_ru`, `out_<entity>_en` — выбирать нужную по текущему языку на фронте (образец: функция `specName` в `features/specialties/specialtiesApi.ts`). При этом процедуры `*_spisok(yazyk_id)` наоборот отдают уже локализованное имя одной колонкой. Какой случай перед вами — проверять через `scripts/api-fields.mjs`, а не угадывать.

**Идентификаторы — строки.** Драйвер `pg` сериализует `bigint` в string. Тип `Id` в `shared/types/api.ts` это фиксирует. Касается всех модулей без исключения.

**Три формата ответа сосуществуют.** Пока не выполнен Task 16:
- `{ ok: true, ... }` — новые эндпоинты (`/auth/*`, `/lang/*`)
- `{ ok: true, page, title, activePage, user, flash, data }` — бывшие `res.render` через `apiCompat`
- `{ success, message, data, totalCount }` — старые CRUD-эндпоинты

Типы всех трёх лежат в `shared/types/api.ts`.

**Часть выборок — POST, а не GET.** Например список специальностей это `POST /api/specialties/tb` с телом `{ search, limit, offset }`. Это не ошибка, а как устроен бэк. В RTK Query такие запросы объявляются через `build.query` с `method: 'POST'` — кэширование при этом работает нормально.

**Ролей в системе нет.** Хелперы `hasRole`/`hasPermission` в старом hbs всегда возвращали false — данные о ролях не загружаются нигде. Разграничение сводится к `student` или `sotrudnik`, `RequireAuth` это повторяет. Пять ролей из README — нереализованный замысел.

**Язык.** Фронт — источник истины: хранит выбор в `localStorage` и шлёт заголовок `X-Lang`. Бэк также кладёт язык в сессию, чтобы выбор пережил перезагрузку. Словари не дублируются во фронте, а тянутся с `/api/lang/translations` из `unispace-back/src/locales/*.json`. Новый ключ добавляется сразу в три файла — `ru`, `kk`, `en`.

**Сессия.** Cookie `connect.sid`, хранилище — таблица `session` в PostgreSQL. Все запросы идут с `credentials: 'include'`. В dev браузер видит один origin благодаря прокси Vite `/api` → `localhost:4005`, поэтому CORS не задействован.

### Шаблон нового модуля

```ts
// features/<модуль>/<модуль>Api.ts
export const xApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    xList: build.query<LegacyResponse<XRow[]>, ListArgs>({
      query: (body) => ({ url: '/x/tb', method: 'POST', body }),
      providesTags: ['X'],
    }),
    createX: build.mutation<LegacyResponse, XInput>({
      query: (body) => ({ url: '/x/insert', method: 'POST', body }),
      invalidatesTags: ['X'],   // список перезапросится сам
    }),
  }),
})
```

Новый тег обязательно добавляется в `API_TAGS` в `app/api/baseApi.ts`, иначе RTK Query бросит ошибку в рантайме.

### Чего в каркасе намеренно нет

- Библиотеки форм. Формы простые; если в Task 9 или 11 станет тесно — брать `react-hook-form`.
- `react-i18next`. Свой `I18nProvider` на 40 строк закрывает потребность и переиспользует словари бэка.
- Библиотеки компонентов. Tailwind v4 + собственные примитивы в `shared/ui`. Токены темы объявлены в `@theme` в `src/index.css`, тёмная тема уже работает.
