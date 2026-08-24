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
import { SearchInput } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'

const PAGE_SIZE = 10

/**
 * Справочник групп образовательных программ: поиск, страницы, CRUD.
 * Эталон для остальных справочников — PageHeader + тулбар + DataTable.
 * Поведение перенесено из unispace/src/views/ucheb/gruppa_op.hbs
 */
export default function GruppaOpPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<GruppaOpRow | null>(null)

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
    try {
      const result = await deleteGruppaOp(deleteId).unwrap()
      dispatch(
        toastPushed(
          result.ok ? 'success' : 'error',
          result.error ??
            (result.ok ? t('gruppa_op.success_delete') : t('gruppa_op.error_connection')),
        ),
      )
    } catch {
      dispatch(toastPushed('error', t('gruppa_op.error_connection')))
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteId(null)
    }
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  const columns: Column<GruppaOpRow>[] = [
    {
      key: 'kod',
      header: t('gruppa_op.gruppa_op_kod'),
      className: 'tabular font-medium whitespace-nowrap',
      render: (row) => row.out_gruppa_op_kod,
    },
    { key: 'name_kz', header: t('gruppa_op.name_kz'), render: (row) => row.out_gruppa_op_kz },
    { key: 'name_ru', header: t('gruppa_op.name_ru'), render: (row) => row.out_gruppa_op_ru },
    { key: 'name_en', header: t('gruppa_op.name_en'), render: (row) => row.out_gruppa_op_en },
    {
      key: 'actions',
      header: t('gruppa_op.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.out_gruppa_op_id)}
          deleting={isDeleting && deleteId === row.out_gruppa_op_id}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('gruppa_op.gruppa_op')}
        count={total}
        busy={isFetching}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('gruppa_op.create')}
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
          placeholder={t('gruppa_op.search')}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_gruppa_op_id}
        loading={isFetching}
        emptyMessage={search ? t('common.nothing_found') : t('common.no_data')}
        emptyDescription={
          search ? t('common.nothing_found_hint') : t('common.no_records_hint')
        }
        emptyAction={
          search ? (
            <Button variant="secondary" onClick={() => setSearch('')}>
              {t('ucheb_students.clear_search')}
            </Button>
          ) : (
            <Button icon="plus" onClick={handleCreate}>
              {t('gruppa_op.create')}
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

      <GruppaOpForm open={formOpen} onClose={handleCloseForm} editRow={editRow} />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('gruppa_op.confirm_delete')}
        confirmText={t('gruppa_op.yes')}
        cancelText={t('gruppa_op.no')}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
