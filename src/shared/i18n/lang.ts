export const SUPPORTED_LANGS = ['ru', 'kk', 'en'] as const
export type Lang = (typeof SUPPORTED_LANGS)[number]

export const DEFAULT_LANG: Lang = 'ru'

const STORAGE_KEY = 'unispace.lang'

function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value)
}

/**
 * Читается синхронно при создании baseQuery и store, поэтому localStorage,
 * а не Redux. Приватный режим и заблокированные cookie кидают исключение —
 * отсюда try/catch.
 */
export function getLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLang(stored)) return stored
  } catch {
    // недоступно — работаем на языке по умолчанию
  }
  return DEFAULT_LANG
}

export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // не смогли запомнить — не критично, язык живёт в Redux до перезагрузки
  }
}
