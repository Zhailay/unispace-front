import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteObshNameMutation,
  useObshNameListQuery,
  type ObshNameRow,
} from '@/features/obshName/obshNameApi'
import ObshNameForm from '@/features/obshName/ObshNameForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

export default function ObshNamePage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<ObshNameRow | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  const { data, isFetching } = useObshNameListQuery({
    search,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })
  const [deleteObshName, { isLoading: isDeleting }] = useDeleteObshNameMutation()

  const rows = data?.data ?? []
  const total = data?.totalCount ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: ObshNameRow) {
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
    const result = await deleteObshName(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.ok ? 'success' : 'error',
        result.error ??
          (result.ok ? t('obsh_name.success_delete') : t('obsh_name.error_connection')),
      ),
    )
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  function handleClearSearch() {
    setSearch('')
    setPage(0)
  }

  const columns: Column<ObshNameRow>[] = [
    {
      key: 'name_kz',
      header: t('obsh_name.name_kz'),
      render: (row) => row.out_obsh_name_kz,
    },
    {
      key: 'name_ru',
      header: t('obsh_name.name_ru'),
      render: (row) => row.out_obsh_name_ru,
    },
    {
      key: 'name_en',
      header: t('obsh_name.name_en'),
      render: (row) => row.out_obsh_name_en,
    },
    {
      key: 'short_kz',
      header: t('obsh_name.short_kz'),
      render: (row) => row.out_obsh_name_short_kz,
    },
    {
      key: 'short_ru',
      header: t('obsh_name.short_ru'),
      render: (row) => row.out_obsh_name_short_ru,
    },
    {
      key: 'short_en',
      header: t('obsh_name.short_en'),
      render: (row) => row.out_obsh_name_short_en,
    },
    {
      key: 'actions',
      header: t('obsh_name.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            loading={isDeleting && deleteId === row.out_obsh_name_id}
            onClick={() => handleDeleteClick(row.out_obsh_name_id)}
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
        <h1 className="text-xl font-semibold">{t('obsh_name.menu_name')}</h1>
        {isFetching && <Spinner className="size-4" />}
        <span className="ml-auto text-sm text-muted">{total}</span>
      </div>

      <div className="flex items-end gap-3">
        <Input
          label={t('obsh_name.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder={t('common.search')}
          className="max-w-sm"
        />
        <Button variant="secondary" onClick={handleClearSearch}>
          {t('common.clear')}
        </Button>
        <Button onClick={handleCreate}>{t('obsh_name.create')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_obsh_name_id}
        loading={isFetching}
      />

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

      <ObshNameForm open={formOpen} onClose={handleCloseForm} editRow={editRow} />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('obsh_name.confirm_delete')}
        confirmText={t('obsh_name.yes')}
        cancelText={t('obsh_name.no')}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
