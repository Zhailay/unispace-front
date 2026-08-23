import { createContext } from 'react'

export type TFunction = (key: string, params?: Record<string, string | number>) => string

/** До загрузки словаря возвращаем сам ключ — так же вёл себя серверный t(). */
export const I18nContext = createContext<TFunction>((key) => key)
