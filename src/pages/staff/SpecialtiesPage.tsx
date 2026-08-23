import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteSpecialtyMutation,
  useSpecialtiesPageQuery,
  useSpecialtiesQuery,
  type SpecialtyRow,
} from '@/features/specialties/specialtiesApi'
import SpecialtyForm from '@/features/specialties/SpecialtyForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'

const PAGE_SIZE = 20

/**
 * Specialty directory page: search, pagination, create, edit, delete.
 * Matches behavior from unispace/src/views/ucheb/specialties.hbs
 */
export default function SpecialtiesPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<SpecialtyRow | null>(null)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

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
  const gruppaOpList = pageData?.data?.gruppaOpList ?? []

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: SpecialtyRow) {
    setEditRow(row)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditRow(null)
  }

  function handleDeleteClick(id: Id) {
    setDeleteId(id)
    setDeleteConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return
    setDeleteConfirmOpen(false)
    const result = await deleteSpecialty(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.ok ? 'success' : 'error',
        result.error ??
          (result.ok ? t('specialties.success_delete') : t('specialties.error_connection')),
      ),
    )
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  const columns: Column<SpecialtyRow>[] = [
    {
      key: 'spec_kod',
      header: t('specialties.spec_kod'),
      render: (row) => row.out_spec_kod,
    },
    {
      key: 'name_kz',
      header: t('specialties.name_kz'),
      render: (row) => row.out_spec_kz,
    },
    {
      key: 'name_ru',
      header: t('specialties.name_ru'),
      render: (row) => row.out_spec_ru,
    },
    {
      key: 'name_en',
      header: t('specialties.name_en'),
      render: (row) => row.out_spec_en,
    },
    {
      key: 'gruppa_op',
      header: t('specialties.gruppa_op'),
      render: (row) => row.out_gruppa_op_name ?? '',
    },
    {
      key: 'actions',
      header: t('specialties.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            loading={isDeleting && deleteId === row.out_spec_id}
            onClick={() => handleDeleteClick(row.out_spec_id)}
          >
            {t('common.delete')}
          </Button>
        </div>
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

      <div className="flex items-end gap-3">
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
        <Button onClick={handleCreate}>{t('specialties.create')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_spec_id}
        loading={isFetching}
      />

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

      <SpecialtyForm
        open={formOpen}
        onClose={handleCloseForm}
        gruppaOpList={gruppaOpList}
        editRow={editRow}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('specialties.confirm_delete')}
        confirmText={t('specialties.yes')}
        cancelText={t('specialties.no')}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
