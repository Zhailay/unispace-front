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
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'

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

  const positions = pageData?.data.positions ?? []
  const vidPersonalList = pageData?.data.vidPersonalList ?? []
  const meta = pageData?.data.meta ?? { total: 0 }

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
      render: (row) => row.vidPersonalName ?? '',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            className="px-2 py-1 text-xs"
            loading={isDeleting && deleteId === row.id}
            onClick={() => handleDeleteClick(row.id)}
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
        <h1 className="text-xl font-semibold">{t('nav.positions')}</h1>
        {isFetching && <Spinner className="size-4" />}
        <Button className="ml-auto" onClick={handleCreate}>
          {t('common.create')}
        </Button>
      </div>

      <div className="flex items-end gap-6">
        <div className="text-sm">
          {t('kadr.count')}: <b>{meta.total}</b>
        </div>
        <div className="max-w-sm">
          <Input
            label={t('nav.positions')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={positions}
        rowKey={(row) => row.id}
        loading={isFetching}
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
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
