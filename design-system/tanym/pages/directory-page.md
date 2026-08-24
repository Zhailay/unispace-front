# Эталон: страница-справочник

Источник истины по вёрстке всех разделов `/staff/*`.
Живой пример — `src/pages/staff/GruppaOpPage.tsx` и `src/features/gruppaOp/GruppaOpForm.tsx`.

Переопределяет MASTER.md в части структуры страницы.

## Скелет страницы

```tsx
<div className="flex flex-col gap-5">
  <PageHeader
    title={t('<module>.<title_key>')}
    count={total}                 // необязательно
    busy={isFetching}
    actions={<Button icon="plus" onClick={handleCreate}>{t('<module>.create')}</Button>}
  />

  {/* тулбар: поиск и/или фильтры */}
  <div className="w-full sm:max-w-xs">
    <SearchInput label={t('common.search')} value={search} onChange={...} onClear={...} />
  </div>

  <DataTable ... />
  <Pagination page={page} lastPage={lastPage} onPageChange={setPage} total={total} pageSize={PAGE_SIZE} />

  <XxxForm open={formOpen} onClose={handleCloseForm} editRow={editRow} />
  <ConfirmDialog ... loading={isDeleting} />
</div>
```

Внешние отступы и `max-w-7xl` уже заданы в `StaffLayout` — на странице их не повторять.

## Обязательные правила

1. **Никаких эмодзи.** Иконки только через `<Icon name="..." />` (`shared/ui/Icon.tsx`).
   Нужной иконки нет — добавить путь в `PATHS`, а не рисовать эмодзи.
2. **Кнопки только `<Button>`.** Никаких «голых» `<button>` со своими классами
   и никаких `className="px-2 py-1 text-xs"` — размер задаётся `size="sm" | "md"`.
3. **Действия строки — `<RowActions>`.** Колонка: `align: 'right'`, `className: 'w-px'`.
4. **Поля только `Input`/`Select`/`Textarea`/`SearchInput`** из `shared/ui/Field`.
   Высота контролов `h-10` совпадает с `Button size="md"` — не переопределять.
5. **Числа и коды** (ИИН, коды, суммы) — класс `tabular`, иначе цифры «пляшут».
6. **Пустое состояние** передаётся в `DataTable` через `emptyMessage` /
   `emptyDescription` / `emptyAction`, различая «ничего не найдено» (есть поиск)
   и «записей нет» (поиска нет). Ключи: `common.nothing_found`,
   `common.nothing_found_hint`, `common.no_records_hint`.
7. **Загрузка** — скелетоны внутри `DataTable` (по умолчанию), не спиннер на всю страницу.
8. **Цвета только через токены**: `bg-surface`, `text-muted`, `border-border`,
   `bg-primary-soft`, `text-danger` и т.д. Никаких `bg-white`, `text-gray-500`,
   `bg-slate-*` — они ломают тёмную тему.

## Модалка формы

Кнопки — в слоте `footer`, форма — в теле, связь через `form={formId}`:

```tsx
const formId = '<module>-form'

<Modal
  open={open} onClose={onClose}
  title={isEdit ? t('<m>.change_x') : t('<m>.add_x')}
  footer={
    <div className="flex justify-end gap-2">
      <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
        {t('<m>.cancel_but')}
      </Button>
      <Button type="submit" form={formId} loading={isLoading}>{t('<m>.save_but')}</Button>
    </div>
  }
>
  <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">…</form>
</Modal>
```

Парные поля (каз./рус.) — в `<div className="grid gap-4 sm:grid-cols-2">`.

## Чего не делать

- Не менять логику запросов, RTK Query и обработку ответов — задача чисто визуальная.
- Не переименовывать поля `out_*` из ответов процедур.
- Не трогать ключи переводов, которых нет в `unispace-back/src/locales/*.json`;
  нужен новый ключ — добавить сразу в `ru`, `kk` и `en`.
