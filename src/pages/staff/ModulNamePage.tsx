import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteModulNameMutation,
  useModulNamePageQuery,
  useModulNameListQuery,
  type ModulNameRow,
} from '@/features/modulName/modulNameApi'
import ModulNameForm from '@/features/modulName/ModulNameForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

export default function ModulNamePage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<ModulNameRow | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  const { data: pageData } = useModulNamePageQuery()
  const { data, isFetching } = useModulNameListQuery({
    search,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })
  const [deleteModulName, { isLoading: isDeleting }] = useDeleteModulNameMutation()

  const rows = data?.data ?? []
  const total = data?.totalCount ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
  const tipModulList = pageData?.data.tipModulList ?? []

  // Create a map for tip_modul_id to tip_modul_name
  const tipModulMap = new Map(tipModulList.map((item) => [String(item.tip_modul_id), item.tip_modul_name]))

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: ModulNameRow) {
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
    const result = await deleteModulName(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.success ? 'success' : 'error',
        result.message ??
          (result.success ? t('modul_name.success_delete') : t('modul_name.error_connection')),
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

  const columns: Column<ModulNameRow>[] = [
    {
      key: 'tip_modul',
      header: t('modul_name.tip_modul'),
      render: (row) => (row.out_id_tip_modul ? tipModulMap.get(String(row.out_id_tip_modul)) ?? '' : ''),
    },
    {
      key: 'name_kz',
      header: t('modul_name.name_kz'),
      render: (row) => row.out_modul_name_kz,
    },
    {
      key: 'name_ru',
      header: t('modul_name.name_ru'),
      render: (row) => row.out_modul_name_ru,
    },
    {
      key: 'name_en',
      header: t('modul_name.name_en'),
      render: (row) => row.out_modul_name_en,
    },
    {
      key: 'short_kz',
      header: t('modul_name.short_kz'),
      render: (row) => row.out_modul_name_short_kz,
    },
    {
      key: 'short_ru',
      header: t('modul_name.short_ru'),
      render: (row) => row.out_modul_name_short_ru,
    },
    {
      key: 'short_en',
      header: t('modul_name.short_en'),
      render: (row) => row.out_modul_name_short_en,
    },
    {
      key: 'actions',
      header: t('modul_name.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            loading={isDeleting && deleteId === row.out_modul_name_id}
            onClick={() => handleDeleteClick(row.out_modul_name_id)}
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
        <h1 className="text-xl font-semibold">{t('modul_name.menu_name')}</h1>
        {isFetching && <Spinner className="size-4" />}
        <span className="ml-auto text-sm text-muted">{total}</span>
      </div>

      <div className="flex items-end gap-3">
        <Input
          label={t('modul_name.search')}
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
        <Button onClick={handleCreate}>{t('modul_name.create')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_modul_name_id}
        loading={isFetching}
      />

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

      <ModulNameForm
        open={formOpen}
        onClose={handleCloseForm}
        tipModulList={tipModulList}
        editRow={editRow}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('modul_name.confirm_delete')}
        confirmText={t('modul_name.yes')}
        cancelText={t('modul_name.no')}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
