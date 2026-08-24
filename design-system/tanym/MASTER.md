# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Tanym
**Generated:** 2026-08-24 13:50:53
**Category:** Analytics Dashboard

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#1E40AF` | `--color-primary` |
| Secondary | `#3B82F6` | `--color-secondary` |
| CTA/Accent | `#F59E0B` | `--color-cta` |
| Background | `#F8FAFC` | `--color-background` |
| Text | `#1E3A8A` | `--color-text` |

**Color Notes:** Blue data + amber highlights

### Typography

- **Heading Font:** Fira Code
- **Body Font:** Fira Sans
- **Mood:** dashboard, data, analytics, code, technical, precise
- **Google Fonts:** [Fira Code + Fira Sans](https://fonts.google.com/share?selection.family=Fira+Code:wght@400;500;600;700|Fira+Sans:wght@300;400;500;600;700)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #F59E0B;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #1E40AF;
  border: 2px solid #1E40AF;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #1E40AF;
  outline: none;
  box-shadow: 0 0 0 3px #1E40AF20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Data-Dense Dashboard

**Keywords:** Multiple charts/widgets, data tables, KPI cards, minimal padding, grid layout, space-efficient, maximum data visibility

**Best For:** Business intelligence dashboards, financial analytics, enterprise reporting, operational dashboards, data warehousing

**Key Effects:** Hover tooltips, chart zoom on click, row highlighting on hover, smooth filter animations, data loading spinners

### Page Pattern

**Pattern Name:** Data-Dense + Drill-Down

- **CTA Placement:** Above fold
- **Section Order:** Hero > Features > CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Ornate design
- ❌ No filtering

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

---

## Как это реализовано в Tanym (осознанные отступления)

Раздел дописан вручную при внедрении системы. Где реализация расходится с
сгенерированными выше рекомендациями — здесь сказано почему.

### Токены живут в `src/index.css`

Отдельного `tailwind.config.js` нет: Tailwind v4 настраивается блоком
`@theme` прямо в CSS. Имена токенов — `--color-primary`, `--color-surface`,
`--color-muted`, `--color-border`, `--radius-card`, `--shadow-card` и т.д.
**Ни один цвет не пишется хардкодом** (`bg-white`, `text-gray-500`) — иначе
ломается тёмная тема.

### Отступление 1: цвет основного текста

Рекомендованный `#1E3A8A` (синий) применён к акцентам и заголовкам, но НЕ к
основному тексту. Для body взят нейтральный тёмный `oklch(0.24 0.03 265)`
(≈ `#0F172A`): синий текст на светлом фоне не добирает контраста 4.5:1,
которого требует чеклист самой системы. Плотные таблицы читаются хуже всего,
поэтому здесь контраст важнее фирменного оттенка.

### Отступление 2: Fira Code не используется как шрифт заголовков

Моноширинный шрифт в заголовках админки мешает сканированию длинных русских
и казахских названий. `Fira Sans` отвечает и за заголовки, и за текст.
`Fira Code` подключён как `--font-mono` и применяется точечно.

Для цифр (ИИН, коды, оценки, суммы) есть класс `.tabular`
(`font-variant-numeric: tabular-nums`) — он даёт выравнивание разрядов,
ради которого и рекомендовался моноширинный шрифт, но без потери читаемости.

### Отступление 3: акцент `#F59E0B` не используется как CTA

Основные действия — фирменного синего цвета (`bg-primary`). Янтарный оставлен
для семантики «внимание/ожидает» (`--color-warning`, `bg-warning-soft`).
В админке янтарная кнопка «Создать» читалась бы как предупреждение.

### Реализованные требования чеклиста

- Иконки — только SVG (`shared/ui/Icon.tsx`, набор Lucide). Эмодзи запрещены.
- `cursor-pointer` на всех кликабельных элементах.
- Переходы 150 мс, `focus-visible` контур на всех интерактивных элементах.
- `prefers-reduced-motion` — анимации отключаются (см. конец `index.css`).
- Тёмная тема: и по системной настройке, и по `data-theme` на `<html>`.
- Скелетоны при загрузке (`shared/ui/Skeleton.tsx`), а не пустой экран.
- Осмысленные пустые состояния (`shared/ui/EmptyState.tsx`).

### Ключевой баг вёрстки, который нельзя вернуть

Preflight Tailwind v4 содержит `*,::after,::before,::backdrop { margin:0 }`.
Это перебивает `dialog:modal { margin:auto }` из UA-стилей, и модалка
прилипает к левому верхнему углу. Поэтому у `<dialog>` в `Modal.tsx`
обязателен класс `m-auto` — **не удалять**.

### Проверенный контраст (WCAG AA, 4.5:1)

Значения токенов подобраны расчётом, а не на глаз. Худший случай каждого
текстового токена против `bg`, `surface` и `surface-2`:

| Токен | Светлая | Тёмная |
|---|---|---|
| `fg` | 15.33 | 14.25 |
| `muted` | 5.12 | 6.45 |
| `subtle` | 4.71 | 4.76 |
| `primary` | 7.23 | 4.96 |
| `danger` | 5.00 | 4.53 |
| `success` | 4.73 | 5.47 |

Кнопки: `primary-fg` на `primary` — 7.77 (светлая) / 6.11 (тёмная);
белый на `danger` — 5.37.

**Меняя светлоту (L) любого из этих токенов, пересчитайте контраст.**
`subtle` и `success` уже стоят у самой границы: `subtle` светлее 0.55 в
светлой теме проваливает проверку на `surface-2`.

### Ловушка: несуществующий токен молча остаётся без цвета

Tailwind не ругается на `text-error` или `bg-surface-alt` — он просто не
генерирует правило, и элемент остаётся без цвета. Найдено и исправлено
четыре таких случая: `text-error` (оба дашборда), `text-warning-fg`
(дашборд сотрудника), `bg-surface-alt` (подразделения).

**Полный список объявленных цветовых токенов** (`src/index.css`, `@theme`):

```
bg  surface  surface-2  border  border-strong
fg  muted  subtle
primary  primary-hover  primary-fg  primary-soft
accent  accent-fg
success  success-soft
danger  danger-hover  danger-soft  danger-fg
warning  warning-soft
info  info-soft
```

Другого цвета в разметке быть не должно. Проверить можно так: выписать все
`--color-*` из `index.css` и сверить с классами `bg-/text-/border-` в `src`.

### `danger-fg` переворачивается в тёмной теме

Белый текст на `--color-danger` в тёмной теме даёт лишь **3.53:1** — красный
там светлее. Поэтому у красной кнопки текст берётся из `--color-danger-fg`:
белый в светлой теме, почти чёрный (`oklch(0.18 0.05 27)`, 5.38:1) в тёмной.
Не заменять на `text-white`.
