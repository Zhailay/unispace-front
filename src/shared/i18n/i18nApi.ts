import { baseApi } from '@/app/api/baseApi'
import type { ApiOk } from '@/shared/types/api'
import type { Lang } from './lang'

/** Словарь произвольной вложенности: common.app_name, error.not_found, ... */
export type TranslationTree = { [key: string]: string | TranslationTree }

interface TranslationsResponse extends ApiOk {
  lang: Lang
  translations: TranslationTree
}

export const i18nApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Переводы берём с бэка из src/locales/*.json — один источник правды,
    // дублировать файлы во фронте не нужно.
    translations: build.query<TranslationsResponse, Lang>({
      query: (lang) => `/lang/translations?lang=${lang}`,
    }),

    setLanguage: build.mutation<ApiOk & { lang: Lang }, Lang>({
      query: (lang) => ({ url: '/lang', method: 'POST', body: { lang } }),
    }),
  }),
})

export const { useTranslationsQuery, useSetLanguageMutation } = i18nApi
