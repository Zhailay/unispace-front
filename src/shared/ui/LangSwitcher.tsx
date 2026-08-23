import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { langChanged } from '@/features/ui/uiSlice'
import { useSetLanguageMutation } from '@/shared/i18n/i18nApi'
import { SUPPORTED_LANGS, type Lang } from '@/shared/i18n/lang'

const LABELS: Record<Lang, string> = { ru: 'RU', kk: 'KK', en: 'EN' }

export default function LangSwitcher() {
  const lang = useAppSelector((s) => s.ui.lang)
  const dispatch = useAppDispatch()
  const [persist] = useSetLanguageMutation()

  function change(next: Lang) {
    if (next === lang) return
    // Локально переключаем сразу, на бэк отправляем «в фоне»:
    // сессия нужна лишь чтобы выбор пережил перезагрузку вкладки.
    dispatch(langChanged(next))
    persist(next)
  }

  return (
    <div className="flex gap-0.5 rounded-card border border-border p-0.5" role="group" aria-label="Язык">
      {SUPPORTED_LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => change(code)}
          aria-pressed={lang === code}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            lang === code ? 'bg-primary text-primary-fg' : 'text-muted hover:text-fg'
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  )
}
