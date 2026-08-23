import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  specName,
  useDeleteSpecialtyMutation,
  useSpecialtiesPageQuery,
  useSpecialtiesQuery,
  type SpecialtyRow,
} from '@/features/specialties/specialtiesApi'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'

const PAGE_SIZE = 20

/**
 * Эталонная страница-справочник: поиск + пагинация + удаление.
 * Остальные справочники (группы, дисциплины, модули) переносятся по этому образцу.
 */
export default function SpecialtiesPage() {
  const t = useT()
  const dispatch = useAppDispatch()
  const lang = useAppSelector((s) => s.ui.lang)

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

  async function handleDelete(id: Id) {
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

  const columns: Column<SpecialtyRow>[] = [
    {
      key: 'spec_kod',
      header: t('specialties.spec_kod'),
      render: (row) => row.out_spec_kod,
    },
    {
      key: 'name',
      header: t('specialties.name_ru'),
      render: (row) => specName(row, lang),
    },
    {
      key: 'actions',
      header: t('specialties.actions'),
      render: (row) => (
        <Button
          variant="danger"
          loading={isDeleting}
          onClick={() => handleDelete(row.out_spec_id)}
        >
          {t('common.delete')}
        </Button>
      ),
    },
  ]

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

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_spec_id}
        loading={isFetching}
      />

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

      {/* Список групп ОП уже загружен — понадобится для формы создания (Task 3 плана). */}
      {pageData && (
        <p className="text-xs text-muted">
          {t('specialties.gruppa_op')}: {pageData.data.gruppaOpList.length}
        </p>
      )}
    </div>
  )
}
