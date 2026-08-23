import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteGruppaMutation,
  useGruppaListQuery,
  useGruppaPageQuery,
  type GruppaRow,
} from '@/features/gruppa/gruppaApi'
import GruppaForm from '@/features/gruppa/GruppaForm'
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
 * Gruppa (student groups) directory page: search, pagination, create, edit, delete.
 * Matches behavior from unispace/src/views/ucheb/gruppa.hbs
 */
export default function GruppaPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<GruppaRow | null>(null)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  // Load page data (dropdown lists)
  const { data: pageData, isLoading: isPageLoading } = useGruppaPageQuery()

  // Load groups list
  const { data, isFetching } = useGruppaListQuery({
    search,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })
  const [deleteGruppa, { isLoading: isDeleting }] = useDeleteGruppaMutation()

  const rows = data?.data ?? []
  const total = data?.totalCount ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  // Extract dropdown lists from page data
  const otdelenieList = pageData?.data?.otdelenie_list ?? []
  const specList = pageData?.data?.spec_list ?? []
  const formaObuchList = pageData?.data?.forma_obuch_list ?? []
  const godList = pageData?.data?.god_list ?? []

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: GruppaRow) {
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
    const result = await deleteGruppa(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.ok ? 'success' : 'error',
        result.error ??
          (result.ok ? t('ucheb_groups.success_delete') : t('ucheb_groups.error_connection')),
      ),
    )
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  const columns: Column<GruppaRow>[] = [
    {
      key: 'gruppa_name',
      header: t('ucheb_groups.group_name'),
      render: (row) => row.out_gruppa_name,
    },
    {
      key: 'spec',
      header: t('ucheb_groups.qualification'),
      render: (row) => row.out_spec_ru ?? '',
    },
    {
      key: 'forma_obuch',
      header: t('ucheb_groups.level_of_education'),
      render: (row) => row.out_forma_obuch_ru ?? '',
    },
    {
      key: 'otdelenie',
      header: t('ucheb_groups.language_of_instruction'),
      render: (row) => row.out_otdelenie_ru ?? '',
    },
    {
      key: 'actions',
      header: t('ucheb_groups.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            loading={isDeleting && deleteId === row.out_gruppa_id}
            onClick={() => handleDeleteClick(row.out_gruppa_id)}
          >
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ]

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{t('ucheb_groups.menu_name')}</h1>
        {isFetching && <Spinner className="size-4" />}
        <span className="ml-auto text-sm text-muted">{total}</span>
      </div>

      <div className="flex items-end gap-3">
        <Input
          label={t('ucheb_groups.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder={t('common.search')}
          className="max-w-sm"
        />
        <Button onClick={handleCreate}>{t('ucheb_groups.create')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_gruppa_id}
        loading={isFetching}
      />

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

      <GruppaForm
        open={formOpen}
        onClose={handleCloseForm}
        editRow={editRow}
        otdelenieList={otdelenieList}
        specList={specList}
        formaObuchList={formaObuchList}
        godList={godList}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('ucheb_groups.confirm_delete')}
        confirmText={t('ucheb_groups.yes')}
        cancelText={t('ucheb_groups.no')}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
