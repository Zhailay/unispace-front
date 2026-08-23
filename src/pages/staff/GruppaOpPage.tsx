import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteGruppaOpMutation,
  useGruppaOpListQuery,
  type GruppaOpRow,
} from '@/features/gruppaOp/gruppaOpApi'
import GruppaOpForm from '@/features/gruppaOp/GruppaOpForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

/**
 * GruppaOp (educational program groups) directory page: search, pagination, create, edit, delete.
 * Matches behavior from unispace/src/views/ucheb/gruppa_op.hbs
 */
export default function GruppaOpPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<GruppaOpRow | null>(null)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  const { data, isFetching } = useGruppaOpListQuery({
    search,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })
  const [deleteGruppaOp, { isLoading: isDeleting }] = useDeleteGruppaOpMutation()

  const rows = data?.data ?? []
  const total = data?.totalCount ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: GruppaOpRow) {
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
    const result = await deleteGruppaOp(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.ok ? 'success' : 'error',
        result.error ??
          (result.ok ? t('gruppa_op.success_delete') : t('gruppa_op.error_connection')),
      ),
    )
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  const columns: Column<GruppaOpRow>[] = [
    {
      key: 'kod',
      header: t('gruppa_op.gruppa_op_kod'),
      render: (row) => row.out_gruppa_op_kod,
    },
    {
      key: 'name_kz',
      header: t('gruppa_op.name_kz'),
      render: (row) => row.out_gruppa_op_kz,
    },
    {
      key: 'name_ru',
      header: t('gruppa_op.name_ru'),
      render: (row) => row.out_gruppa_op_ru,
    },
    {
      key: 'name_en',
      header: t('gruppa_op.name_en'),
      render: (row) => row.out_gruppa_op_en,
    },
    {
      key: 'actions',
      header: t('gruppa_op.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            loading={isDeleting && deleteId === row.out_gruppa_op_id}
            onClick={() => handleDeleteClick(row.out_gruppa_op_id)}
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
        <h1 className="text-xl font-semibold">{t('gruppa_op.gruppa_op')}</h1>
        {isFetching && <Spinner className="size-4" />}
        <span className="ml-auto text-sm text-muted">{total}</span>
      </div>

      <div className="flex items-end gap-3">
        <Input
          label={t('gruppa_op.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder={t('common.search')}
          className="max-w-sm"
        />
        <Button onClick={handleCreate}>{t('gruppa_op.create')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_gruppa_op_id}
        loading={isFetching}
      />

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

      <GruppaOpForm
        open={formOpen}
        onClose={handleCloseForm}
        editRow={editRow}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('gruppa_op.confirm_delete')}
        confirmText={t('gruppa_op.yes')}
        cancelText={t('gruppa_op.no')}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
