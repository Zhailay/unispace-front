/**
 * Формы ответов бэка.
 *
 * Исторически контроллеры отвечают тремя разными способами — при переносе
 * страниц это постепенно сводится к ApiOk/ApiError, но пока фронт должен
 * уметь читать все три.
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
 * Ответ страничного контроллера через слой совместимости (apiCompat.js):
 * бывший res.render() отдаёт данные шаблона в поле data.
 */
export interface PageResponse<T> {
  ok: true
  page: string
  title: string | null
  activePage: string | null
  user: CurrentUser | null
  flash: { success: string | null; error: string | null }
  data: T
}

/** Старый формат CRUD-эндпоинтов: { success, message, data } */
export interface LegacyResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  totalCount?: number
}

/** Пользователь: студент или сотрудник. Роли на бэке не реализованы. */
export interface CurrentUser {
  id: number
  iin: string
  lastName: string
  firstName: string
  middleName: string | null
  fullName: string
  type: UserType
  /** Присутствует только у сотрудников */
  sotrudnik_id?: number
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
