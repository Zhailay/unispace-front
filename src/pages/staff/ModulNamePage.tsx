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
import { SearchInput } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'
import Badge from '@/shared/ui/Badge'

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
  const tipModulList = pageData?.data?.tipModulList ?? []

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
        result.ok ? 'success' : 'error',
        result.error ??
          (result.ok ? t('modul_name.success_delete') : t('modul_name.error_connection')),
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
      className: 'w-px',
      render: (row) => {
        const name = row.out_id_tip_modul ? tipModulMap.get(String(row.out_id_tip_modul)) ?? '' : ''
        return name ? <Badge tone="primary">{name}</Badge> : ''
      },
    },
    {
      key: 'name_kz',
      header: t('modul_name.name_kz'),
      className: 'font-medium',
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
      className: 'text-muted whitespace-nowrap',
      render: (row) => row.out_modul_name_short_kz,
    },
    {
      key: 'short_ru',
      header: t('modul_name.short_ru'),
      className: 'text-muted whitespace-nowrap',
      render: (row) => row.out_modul_name_short_ru,
    },
    {
      key: 'short_en',
      header: t('modul_name.short_en'),
      className: 'text-muted whitespace-nowrap',
      render: (row) => row.out_modul_name_short_en,
    },
    {
      key: 'actions',
      header: t('modul_name.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.out_modul_name_id)}
          deleting={isDeleting && deleteId === row.out_modul_name_id}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('modul_name.menu_name')}
        count={total}
        busy={isFetching}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('modul_name.create')}
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
          placeholder={t('modul_name.search')}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_modul_name_id}
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
              {t('modul_name.create')}
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
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
