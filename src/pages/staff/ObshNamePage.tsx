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
import { SearchInput } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'

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
      className: 'font-medium',
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
      className: 'text-muted whitespace-nowrap',
      render: (row) => row.out_obsh_name_short_kz,
    },
    {
      key: 'short_ru',
      header: t('obsh_name.short_ru'),
      className: 'text-muted whitespace-nowrap',
      render: (row) => row.out_obsh_name_short_ru,
    },
    {
      key: 'short_en',
      header: t('obsh_name.short_en'),
      className: 'text-muted whitespace-nowrap',
      render: (row) => row.out_obsh_name_short_en,
    },
    {
      key: 'actions',
      header: t('obsh_name.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.out_obsh_name_id)}
          deleting={isDeleting && deleteId === row.out_obsh_name_id}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('obsh_name.menu_name')}
        count={total}
        busy={isFetching}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('obsh_name.create')}
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
          onClear={handleClearSearch}
          placeholder={t('obsh_name.search')}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_obsh_name_id}
        loading={isFetching}
        emptyMessage={search ? t('common.nothing_found') : t('common.no_data')}
        emptyDescription={search ? t('common.nothing_found_hint') : t('common.no_records_hint')}
        emptyAction={
          search ? (
            <Button variant="secondary" onClick={handleClearSearch}>
              {t('ucheb_students.clear_search')}
            </Button>
          ) : (
            <Button icon="plus" onClick={handleCreate}>
              {t('obsh_name.create')}
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

      <ObshNameForm open={formOpen} onClose={handleCloseForm} editRow={editRow} />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('obsh_name.confirm_delete')}
        confirmText={t('obsh_name.yes')}
        cancelText={t('obsh_name.no')}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
