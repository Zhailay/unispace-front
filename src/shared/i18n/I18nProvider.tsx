import { useCallback, type ReactNode } from 'react'
import { useAppSelector } from '@/app/hooks'
import { useTranslationsQuery, type TranslationTree } from './i18nApi'
import { I18nContext, type TFunction } from './i18nContext'

function resolve(tree: TranslationTree | undefined, path: string): string | undefined {
  if (!tree) return undefined

  let node: string | TranslationTree | undefined = tree
  for (const segment of path.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined
    node = node[segment]
  }
  return typeof node === 'string' ? node : undefined
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = useAppSelector((s) => s.ui.lang)
  const { data } = useTranslationsQuery(lang)

  const t = useCallback<TFunction>(
    (key, params) => {
      let text = resolve(data?.translations, key) ?? key

      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replaceAll(`{{${name}}}`, String(value))
        }
      }
      return text
    },
    [data],
  )

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
}
