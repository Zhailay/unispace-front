import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteSpecialtyMutation,
  useSpecialtiesPageQuery,
  useSpecialtiesQuery,
} from '@/features/specialties/specialtiesApi'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'

const PAGE_SIZE = 20

/**
 * Эталонная страница-справочник: поиск + пагинация + удаление.
 * Остальные справочники (группы, дисциплины, модули) переносятся по этому образцу.
 */
export default function SpecialtiesPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data: pageData } = useSpecialtiesPageQuery()
  const { data, isFetching } = useSpecialtiesQuery({
    search,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })
  const [deleteSpecialty, { isLoading: isDeleting }] = useDeleteSpecialtyMutation()

  const rows = data?.data ?? []
  const total = data?.totalCount ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  async function handleDelete(id: number) {
    const result = await deleteSpecialty(id).unwrap()
    dispatch(
      toastPushed(
        result.success ? 'success' : 'error',
        // Бэк присылает готовый текст; ключи локалей — запасной вариант.
        result.message ??
          (result.success ? t('specialties.success_delete') : t('specialties.error_connection')),
      ),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{t('specialties.specialties')}</h1>
        {isFetching && <Spinner className="size-4" />}
        <span className="ml-auto text-sm text-muted">{total}</span>
      </div>

      <Input
        label={t('specialties.search')}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(0)
        }}
        placeholder={t('common.search')}
        className="max-w-sm"
      />

      <div className="table-scroll rounded-card border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t('specialties.spec_kod')}</th>
              <th className="px-4 py-3 font-medium">{t('specialties.name_ru')}</th>
              <th className="px-4 py-3 font-medium">{t('specialties.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !isFetching && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  {t('common.no_data')}
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.out_spec_id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{row.out_spec_kod}</td>
                <td className="px-4 py-3">{row.out_spec_name}</td>
                <td className="px-4 py-3">
                  <Button
                    variant="danger"
                    loading={isDeleting}
                    onClick={() => handleDelete(row.out_spec_id)}
                  >
                    {t('common.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
          {t('specialties.prev_page')}
        </Button>
        <span className="text-sm text-muted">
          {t('specialties.page')} {page + 1} {t('specialties.of')} {lastPage + 1}
        </span>
        <Button
          variant="secondary"
          disabled={page >= lastPage}
          onClick={() => setPage((p) => p + 1)}
        >
          {t('specialties.next_page')}
        </Button>
      </div>

      {/* Список групп ОП уже загружен — понадобится для формы создания (Task 3 плана). */}
      {pageData && (
        <p className="text-xs text-muted">
          {t('specialties.gruppa_op')}: {pageData.data.gruppaOpList.length}
        </p>
      )}
    </div>
  )
}
