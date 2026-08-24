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
import { SearchInput } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'

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
      className: 'tabular font-medium whitespace-nowrap',
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
      className: 'text-muted',
      render: (row) => row.out_gruppa_op_name ?? '',
    },
    {
      key: 'actions',
      header: t('specialties.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.out_spec_id)}
          deleting={isDeleting && deleteId === row.out_spec_id}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('specialties.specialties')}
        count={total}
        busy={isFetching}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('specialties.create')}
          </Button>
        }
      />

      <div className="w-full sm:max-w-xs">
        <SearchInput
          clearLabel={t('common.clear_search')}
          label={t('common.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          onClear={() => {
            setSearch('')
            setPage(0)
          }}
          placeholder={t('specialties.search')}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_spec_id}
        loading={isFetching}
        emptyMessage={search ? t('common.nothing_found') : t('common.no_data')}
        emptyDescription={search ? t('common.nothing_found_hint') : t('common.no_records_hint')}
        emptyAction={
          search ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('')
                setPage(0)
              }}
            >
              {t('ucheb_students.clear_search')}
            </Button>
          ) : (
            <Button icon="plus" onClick={handleCreate}>
              {t('specialties.create')}
            </Button>
          )
        }
      />

      <Pagination
        page={page}
        lastPage={lastPage}
        onPageChange={setPage}
        total={total}
        pageSize={PAGE_SIZE}
      />

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
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
