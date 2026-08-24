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
import { SearchInput } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'

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
      className: 'font-medium whitespace-nowrap',
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
      className: 'text-muted',
      render: (row) => row.out_forma_obuch_ru ?? '',
    },
    {
      key: 'otdelenie',
      header: t('ucheb_groups.language_of_instruction'),
      className: 'text-muted',
      render: (row) => row.out_otdelenie_ru ?? '',
    },
    {
      key: 'actions',
      header: t('ucheb_groups.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.out_gruppa_id)}
          deleting={isDeleting && deleteId === row.out_gruppa_id}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('ucheb_groups.menu_name')}
        count={total}
        busy={isFetching || isPageLoading}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('ucheb_groups.create')}
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
          placeholder={t('ucheb_groups.search')}
        />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_gruppa_id}
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
              {t('ucheb_groups.create')}
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
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
