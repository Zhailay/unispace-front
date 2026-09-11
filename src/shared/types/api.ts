/**
 * Формы ответов бэка.
 *
 * Все эндпоинты возвращают единый формат: { ok: true, data?, ... } или { ok: false, error }.
 */

/** Успех: { ok: true, ... } */
export interface ApiOk {
  ok: true
}

/** Ошибка: { ok: false, error: '...' } */
export interface ApiError {
  ok: false
  error: string
}

/**
 * Ответ страничного контроллера: { ok: true, data: {...} }
 */
export interface PageResponse<T> {
  ok: true
  data: T
}

/**
 * Новый формат CRUD-эндпоинтов: { ok, error?, data?, totalCount? }
 * Совместим со старым форматом через алиасы success->ok, message->error
 */
export interface LegacyResponse<T = unknown> {
  ok: boolean
  error?: string
  data?: T
  totalCount?: number
  /** @deprecated use ok */
  success?: boolean
  /** @deprecated use error */
  message?: string
}

/**
 * ВАЖНО: все идентификаторы приходят СТРОКАМИ, а не числами.
 *
 * Драйвер `pg` отдаёт PostgreSQL bigint как string, потому что 64-битное
 * целое не помещается в JS number без потери точности. Это касается любого
 * `*_id` во всех модулях.
 *
 * Значит: сравнивать через `===` со строкой, а перед отправкой на бэк
 * приводить как есть — процедуры принимают строку и сами кастуют к ::bigint.
 * Никогда не писать `id === 10` или `parseInt(id)` в ключах React.
 */
export type Id = string

/**
 * ТА ЖЕ ЛОВУШКА, но для дробных: `numeric` / `decimal` / результат `AVG()`
 * драйвер `pg` тоже отдаёт СТРОКОЙ ("4.50") — по той же причине, точность.
 *
 * Опасно тем, что в типах обычно написано `number`, TypeScript спокоен, а в
 * рантайме падает `x.toFixed is not a function` (так было в журнале с
 * `avg_ball`). Перед любой арифметикой или форматированием приводить через
 * `Number(...)`, а тип объявлять честно: `number | string | null`.
 *
 * Проверять на пустоту через `== null`, а не на истинность: `0` — валидная
 * оценка, и `if (!value)` молча превратит её в пустую ячейку.
 */
export type Numeric = number | string

/** Пользователь: студент или сотрудник. Роли на бэке не реализованы. */
export interface CurrentUser {
  id: Id
  iin: string
  lastName: string
  firstName: string
  middleName: string | null
  fullName: string
  type: UserType
  /** Присутствует только у сотрудников */
  sotrudnik_id?: Id
  /** Один и тот же логин зарегистрирован и как студент, и как сотрудник — можно переключиться без пароля */
  hasMultipleRoles: boolean
}

export type UserType = 'student' | 'sotrudnik'

/**
 * Строка справочника из процедур вида <entity>_spisok(yazyk_id).
 * Имена полей зависят от процедуры, поэтому индексная сигнатура.
 */
export interface SpisokRow {
  [key: string]: string | number | null
}

/**
 * Результат процедур вида <entity>_full(p_command, ...).
 * p_command: 1 = INSERT, 2 = UPDATE, 3 = DELETE, 4 = SELECT.
 * out_code: 1 = успех, 2 = дубликат.
 */
export interface FullProcedureRow {
  out_code?: number
  [key: string]: unknown
}

export const FULL_COMMAND = {
  INSERT: 1,
  UPDATE: 2,
  DELETE: 3,
  SELECT: 4,
} as const
