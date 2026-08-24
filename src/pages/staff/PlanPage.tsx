import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeletePlanMutation,
  usePlanListQuery,
  usePlanPageQuery,
  type PlanRow,
} from '@/features/plan/planApi'
import PlanForm from '@/features/plan/PlanForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'
import EmptyState from '@/shared/ui/EmptyState'

/**
 * Plan (curriculum) page: filter by spec/forma_obuch/god/kurs, CRUD operations.
 * Matches behavior from unispace/src/views/ucheb/plan.hbs (797 lines)
 */
export default function PlanPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  // Filter state - all four must be selected to show data
  const [filterSpec, setFilterSpec] = useState<Id>('')
  const [filterFormaObuch, setFilterFormaObuch] = useState<Id>('')
  const [filterGod, setFilterGod] = useState<Id>('')
  const [filterKurs, setFilterKurs] = useState<Id>('0')

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<PlanRow | null>(null)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  // Load page data (dropdown lists)
  const { data: pageData, isLoading: isPageLoading } = usePlanPageQuery()

  // Only fetch list when all filters are selected
  const filtersSelected = filterSpec && filterFormaObuch && filterGod && filterKurs
  const { data, isFetching } = usePlanListQuery(
    {
      id_spec: filterSpec || null,
      id_forma_obuch: filterFormaObuch || null,
      id_god: filterGod || null,
      id_kurs: filterKurs === '0' ? null : filterKurs,
    },
    { skip: !filtersSelected },
  )
  const [deletePlan, { isLoading: isDeleting }] = useDeletePlanMutation()

  const rows = data?.data ?? []

  // Extract dropdown lists from page data
  const specList = pageData?.data?.spec_list ?? []
  const formaObuchList = pageData?.data?.forma_obuch_list ?? []
  const godList = pageData?.data?.god_list ?? []
  const kursList = pageData?.data?.kurs_list ?? []
  const semestrList = pageData?.data?.semestr_list ?? []
  const modulNameList = pageData?.data?.modul_name_list ?? []
  const obshNameList = pageData?.data?.obsh_name_list ?? []
  const formaKontrolyaList = pageData?.data?.forma_kontrolya_list ?? []
  const yazykList = pageData?.data?.yazyk_list ?? []

  function handleCreate() {
    if (!filtersSelected) {
      dispatch(toastPushed('error', t('plan.error_select_kontingent')))
      return
    }
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: PlanRow) {
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
    const result = await deletePlan(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.ok ? 'success' : 'error',
        result.error ?? (result.ok ? t('plan.success_delete') : t('plan.error_connection')),
      ),
    )
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  const columns: Column<PlanRow>[] = [
    {
      key: 'kurs',
      header: t('plan.kurs'),
      className: 'tabular',
      render: (row) => row.out_kurs_nomer ?? '',
    },
    {
      key: 'semestr',
      header: t('plan.semestr'),
      className: 'tabular',
      render: (row) => row.out_semestr_nomer ?? '',
    },
    {
      key: 'period_obuch',
      header: t('plan.period_obuch'),
      render: (row) => row.out_period_obuch_name ?? '',
    },
    {
      key: 'disciplina',
      header: t('plan.disciplina'),
      className: 'min-w-56',
      render: (row) => row.out_disciplina_name ?? '',
    },
    {
      key: 'kod',
      header: t('plan.kod_discipliny'),
      className: 'tabular whitespace-nowrap',
      render: (row) => row.out_plan_kod ?? '',
    },
    {
      key: 'obsh_name',
      header: t('plan.obsh_name'),
      render: (row) => row.out_obsh_name ?? '',
    },
    {
      key: 'modul_name',
      header: t('plan.modul_name'),
      render: (row) => row.out_modul_name ?? '',
    },
    {
      key: 'kredit',
      header: t('plan.kredit'),
      align: 'right',
      className: 'tabular',
      render: (row) => row.out_plan_kredit ?? '',
    },
    {
      key: 'chasy',
      header: t('plan.chasy'),
      align: 'right',
      className: 'tabular',
      render: (row) => row.out_chasy ?? '',
    },
    {
      key: 'yazyk',
      header: t('plan.yazyk_prepodavaniya'),
      render: (row) => row.out_yazyk_prepodavaniya ?? '',
    },
    {
      key: 'vid_zanyatiya',
      header: t('plan.vid_zanyatiya'),
      render: (row) => row.out_vid_zanyatiya_str ?? '',
    },
    {
      key: 'forma_kontrolya',
      header: t('plan.forma_kontrolya'),
      render: (row) => row.out_forma_kontrolya_name ?? '',
    },
    {
      key: 'rezultaty',
      header: t('plan.rezultaty_obucheniya'),
      className: 'min-w-64',
      render: (row) => row.out_plan_ro ?? '',
    },
    {
      key: 'actions',
      header: t('plan.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.out_plan_id)}
          deleting={isDeleting && deleteId === row.out_plan_id}
        />
      ),
    },
  ]

  // Пока грузятся списки фильтров, показываем только шапку со спиннером.
  if (isPageLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title={t('plan.menu_name')} busy />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('plan.menu_name')}
        count={filtersSelected ? rows.length : undefined}
        busy={isFetching}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('plan.create')}
          </Button>
        }
      />

      {/* Карточка фильтров: без выбранного контингента список не загружается. */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Select
            label={t('plan.specialty')}
            value={filterSpec}
            onChange={(e) => setFilterSpec(e.target.value)}
          >
            <option value="">{t('plan.select_spec')}</option>
            {specList.map((item) => (
              <option key={item.spec_id} value={item.spec_id}>
                {item.spec_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('plan.forma_obuch')}
            value={filterFormaObuch}
            onChange={(e) => setFilterFormaObuch(e.target.value)}
          >
            <option value="">{t('plan.select_forma_obuch')}</option>
            {formaObuchList.map((item) => (
              <option key={item.forma_obuch_id} value={item.forma_obuch_id}>
                {item.forma_obuch_name}
              </option>
            ))}
          </Select>

          <Select
            label={t('plan.god')}
            value={filterGod}
            onChange={(e) => setFilterGod(e.target.value)}
            className="tabular"
          >
            <option value="">{t('plan.select_god')}</option>
            {godList.map((item) => (
              <option key={item.god_id} value={item.god_id}>
                {item.god_value}
              </option>
            ))}
          </Select>

          <Select
            label={t('plan.kurs')}
            value={filterKurs}
            onChange={(e) => setFilterKurs(e.target.value)}
            className="tabular"
          >
            <option value="0">{t('plan.all_kurs')}</option>
            {kursList.map((item) => (
              <option key={item.kurs_id} value={item.kurs_id}>
                {item.kurs_nomer}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!filtersSelected ? (
        <div className="rounded-card border border-border bg-surface shadow-card">
          <EmptyState icon="search" title={t('plan.select_filter_prompt')} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowKey={(row) => row.out_plan_id}
          loading={isFetching}
          emptyMessage={t('plan.no_records')}
          emptyDescription={t('common.no_records_hint')}
          emptyAction={
            <Button icon="plus" onClick={handleCreate}>
              {t('plan.create')}
            </Button>
          }
        />
      )}

      <PlanForm
        open={formOpen}
        onClose={handleCloseForm}
        editRow={editRow}
        filterSpec={filterSpec}
        filterFormaObuch={filterFormaObuch}
        filterGod={filterGod}
        filterKurs={filterKurs === '0' ? '' : filterKurs}
        kursList={kursList}
        semestrList={semestrList}
        modulNameList={modulNameList}
        obshNameList={obshNameList}
        formaKontrolyaList={formaKontrolyaList}
        yazykList={yazykList}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('plan.confirm_delete')}
        confirmText={t('plan.yes')}
        cancelText={t('plan.no')}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
