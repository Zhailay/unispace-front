import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteKalendarMutation,
  useKalendarListQuery,
  useKalendarPageQuery,
  type KalendarRow,
} from '@/features/kalendar/kalendarApi'
import KalendarForm from '@/features/kalendar/KalendarForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'
import EmptyState from '@/shared/ui/EmptyState'

const PAGE_SIZE = 10

/** Helper to format date for display */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.substring(0, 10)
}

/**
 * Kalendar (academic calendar) page: filter by spec/forma_obuch/god, pagination, create, edit, delete.
 * Matches behavior from unispace/src/views/ucheb/kalendar.hbs
 */
export default function KalendarPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  // Filter state - all three must be selected to show data
  const [filterSpec, setFilterSpec] = useState<Id>('')
  const [filterFormaObuch, setFilterFormaObuch] = useState<Id>('')
  const [filterGod, setFilterGod] = useState<Id>('')
  const [page, setPage] = useState(0)

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<KalendarRow | null>(null)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  // Load page data (dropdown lists)
  const { data: pageData, isLoading: isPageLoading } = useKalendarPageQuery()

  // Only fetch list when all filters are selected
  const filtersSelected = filterSpec && filterFormaObuch && filterGod
  const { data, isFetching } = useKalendarListQuery(
    {
      id_spec: filterSpec || null,
      id_forma_obuch: filterFormaObuch || null,
      id_god: filterGod || null,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    },
    { skip: !filtersSelected },
  )
  const [deleteKalendar, { isLoading: isDeleting }] = useDeleteKalendarMutation()

  const rows = data?.data ?? []
  const total = data?.totalCount ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  // Extract dropdown lists from page data
  const specList = pageData?.data?.spec_list ?? []
  const formaObuchList = pageData?.data?.forma_obuch_list ?? []
  const godList = pageData?.data?.god_list ?? []
  const kursList = pageData?.data?.kurs_list ?? []
  const semestrList = pageData?.data?.semestr_list ?? []
  const periodObuchList = pageData?.data?.period_obuch_list ?? []

  function handleCreate() {
    if (!filtersSelected) {
      dispatch(toastPushed('error', t('kalendar.error_select_kontingent')))
      return
    }
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: KalendarRow) {
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
    const result = await deleteKalendar(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.ok ? 'success' : 'error',
        result.error ?? (result.ok ? t('kalendar.success_delete') : t('kalendar.error_connection')),
      ),
    )
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  function handleFilterChange(type: 'spec' | 'forma_obuch' | 'god', value: Id) {
    if (type === 'spec') setFilterSpec(value)
    else if (type === 'forma_obuch') setFilterFormaObuch(value)
    else if (type === 'god') setFilterGod(value)
    setPage(0)
  }

  const columns: Column<KalendarRow>[] = [
    {
      key: 'spec',
      header: t('kalendar.specialty'),
      render: (row) => row.out_spec_name ?? '',
    },
    {
      key: 'god',
      header: t('kalendar.enrollment_year'),
      className: 'tabular whitespace-nowrap',
      render: (row) => row.out_god_value ?? '',
    },
    {
      key: 'forma_obuch',
      header: t('kalendar.form_of_education'),
      render: (row) => row.out_forma_obuch_name ?? '',
    },
    {
      key: 'kurs',
      header: t('kalendar.kurs'),
      className: 'tabular',
      render: (row) => row.out_kurs_nomer ?? '',
    },
    {
      key: 'semestr',
      header: t('kalendar.semestr'),
      className: 'tabular',
      render: (row) => row.out_semestr_nomer ?? '',
    },
    {
      key: 'period_obuch',
      header: t('kalendar.period_obuch'),
      render: (row) => row.out_period_obuch_name ?? '',
    },
    {
      key: 'date_start',
      header: t('kalendar.date_start'),
      className: 'tabular whitespace-nowrap',
      render: (row) => formatDate(row.out_kalendar_nachalo),
    },
    {
      key: 'date_end',
      header: t('kalendar.date_end'),
      className: 'tabular whitespace-nowrap',
      render: (row) => formatDate(row.out_kalendar_konec),
    },
    {
      key: 'actions',
      header: t('kalendar.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.out_kalendar_id)}
          deleting={isDeleting && deleteId === row.out_kalendar_id}
        />
      ),
    },
  ]

  // Списки фильтров ещё грузятся — показываем шапку со спиннером,
  // чтобы страница не «прыгала» при появлении контента.
  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t('kalendar.menu_name')} busy />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('kalendar.menu_name')}
        count={filtersSelected ? total : undefined}
        busy={isFetching}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('kalendar.create')}
          </Button>
        }
      />

      {/* Карточка фильтров: раздел бесполезен, пока не выбран контингент. */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Select
            label={t('kalendar.specialty')}
            value={filterSpec}
            onChange={(e) => handleFilterChange('spec', e.target.value)}
          >
            <option value="">{t('kalendar.select_specialty')}</option>
            {specList.map((item) => (
              <option key={item.spec_id} value={item.spec_id}>
                {item.spec_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('kalendar.form_of_education')}
            value={filterFormaObuch}
            onChange={(e) => handleFilterChange('forma_obuch', e.target.value)}
          >
            <option value="">{t('kalendar.select_form_of_education')}</option>
            {formaObuchList.map((item) => (
              <option key={item.forma_obuch_id} value={item.forma_obuch_id}>
                {item.forma_obuch_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('kalendar.enrollment_year')}
            value={filterGod}
            onChange={(e) => handleFilterChange('god', e.target.value)}
            className="tabular"
          >
            <option value="">{t('kalendar.select_enrollment_year')}</option>
            {godList.map((item) => (
              <option key={item.god_id} value={item.god_id}>
                {item.god_value}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!filtersSelected ? (
        <div className="rounded-card border border-border bg-surface shadow-card">
          <EmptyState icon="search" title={t('kalendar.select_filter_prompt')} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={rows}
            rowKey={(row) => row.out_kalendar_id}
            loading={isFetching}
            emptyMessage={t('kalendar.no_records')}
            emptyDescription={t('common.no_records_hint')}
            emptyAction={
              <Button icon="plus" onClick={handleCreate}>
                {t('kalendar.create')}
              </Button>
            }
          />

          <Pagination
            page={page}
            lastPage={lastPage}
            onPageChange={setPage}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </>
      )}

      <KalendarForm
        open={formOpen}
        onClose={handleCloseForm}
        editRow={editRow}
        filterSpec={filterSpec}
        filterFormaObuch={filterFormaObuch}
        filterGod={filterGod}
        specList={specList}
        formaObuchList={formaObuchList}
        godList={godList}
        kursList={kursList}
        semestrList={semestrList}
        periodObuchList={periodObuchList}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('kalendar.confirm_delete')}
        confirmText={t('kalendar.yes')}
        cancelText={t('kalendar.no')}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
