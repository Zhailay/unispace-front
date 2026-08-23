import { useContext } from 'react'
import { I18nContext, type TFunction } from './i18nContext'

/** const t = useT(); t('nav.dashboard') */
export function useT(): TFunction {
  return useContext(I18nContext)
}
