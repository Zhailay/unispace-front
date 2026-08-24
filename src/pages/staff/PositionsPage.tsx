import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  usePositionsPageQuery,
  useDeletePositionMutation,
  type PositionRow,
} from '@/features/kadr/kadrApi'
import PositionForm from '@/features/kadr/PositionForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'

export default function PositionsPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<PositionRow | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  const { data: pageData, isFetching } = usePositionsPageQuery({ search })
  const [deletePosition, { isLoading: isDeleting }] = useDeletePositionMutation()

  const positions = pageData?.data?.positions ?? []
  const vidPersonalList = pageData?.data?.vidPersonalList ?? []
  const meta = pageData?.data?.meta ?? { total: 0 }

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: PositionRow) {
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
    try {
      await deletePosition(deleteId).unwrap()
      dispatch(toastPushed('success', t('kadr.position_deleted')))
    } catch {
      dispatch(toastPushed('error', t('common.error_connection')))
    }
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  const columns: Column<PositionRow>[] = [
    {
      key: 'name_kz',
      header: t('kadr.name_kz'),
      render: (row) => row.kz,
    },
    {
      key: 'name_ru',
      header: t('kadr.name_ru'),
      render: (row) => row.ru,
    },
    {
      key: 'name_en',
      header: t('kadr.name_en'),
      render: (row) => row.en,
    },
    {
      key: 'staff_type',
      header: t('kadr.staff_type'),
      className: 'text-muted',
      render: (row) => row.vidPersonalName ?? '',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.id)}
          deleting={isDeleting && deleteId === row.id}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('nav.positions')}
        count={meta.total}
        busy={isFetching}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('common.create')}
          </Button>
        }
      />

      <div className="w-full sm:max-w-xs">
        <SearchInput
          clearLabel={t('common.clear_search')}
          label={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder={t('common.search')}
        />
      </div>

      <DataTable
        columns={columns}
        data={positions}
        rowKey={(row) => row.id}
        loading={isFetching}
        emptyMessage={search ? t('common.nothing_found') : t('common.no_data')}
        emptyDescription={search ? t('common.nothing_found_hint') : t('common.no_records_hint')}
        emptyAction={
          search ? (
            <Button variant="secondary" onClick={() => setSearch('')}>
              {t('ucheb_students.clear_search')}
            </Button>
          ) : (
            <Button icon="plus" onClick={handleCreate}>
              {t('common.create')}
            </Button>
          )
        }
      />

      <PositionForm
        open={formOpen}
        onClose={handleCloseForm}
        vidPersonalList={vidPersonalList}
        editRow={editRow}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('kadr.confirm_delete_position')}
        confirmText={t('common.yes')}
        cancelText={t('common.no')}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
