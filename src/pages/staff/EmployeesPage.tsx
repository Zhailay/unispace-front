import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useEmployeesPageQuery,
  useDeleteEmployeeMutation,
  type EmployeeRow,
} from '@/features/kadr/kadrApi'
import EmployeeForm from '@/features/kadr/EmployeeForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/Field'
import Icon from '@/shared/ui/Icon'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'

export default function EmployeesPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<EmployeeRow | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  const { data: pageData, isFetching } = useEmployeesPageQuery({ search })
  const [deleteEmployee, { isLoading: isDeleting }] = useDeleteEmployeeMutation()

  const employees = pageData?.data?.employees ?? []
  const departments = pageData?.data?.departments ?? []
  const positions = pageData?.data?.positions ?? []
  const formaList = pageData?.data?.formaList ?? []
  const shtatnostList = pageData?.data?.shtatnostList ?? []
  const meta = pageData?.data?.meta ?? { total: 0, active: 0 }

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: EmployeeRow) {
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
      await deleteEmployee(deleteId).unwrap()
      dispatch(toastPushed('success', t('kadr.employee_deleted')))
    } catch {
      dispatch(toastPushed('error', t('common.error_connection')))
    }
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  const columns: Column<EmployeeRow>[] = [
    {
      key: 'department',
      header: t('kadr.department'),
      className: 'text-muted',
      render: (row) => row.podrazdelenieName ?? '',
    },
    {
      key: 'iin',
      header: t('kadr.iin'),
      className: 'tabular font-medium whitespace-nowrap',
      render: (row) => row.iin,
    },
    {
      key: 'lastname',
      header: t('kadr.lastname'),
      render: (row) => row.familiya,
    },
    {
      key: 'firstname',
      header: t('kadr.firstname'),
      render: (row) => row.imya,
    },
    {
      key: 'middlename',
      header: t('kadr.middlename'),
      render: (row) => row.otchestvo ?? '',
    },
    {
      key: 'position',
      header: t('kadr.position'),
      render: (row) => row.doljnostName ?? '',
    },
    {
      key: 'replacement_form',
      header: t('kadr.replacement_form'),
      className: 'text-muted',
      render: (row) => row.formaZamescheniyaName ?? '',
    },
    {
      key: 'staffing',
      header: t('kadr.staffing'),
      className: 'text-muted',
      render: (row) => row.shtatnostName ?? '',
    },
    {
      key: 'status',
      header: t('kadr.active_short'),
      align: 'center',
      render: (row) =>
        row.status ? (
          <Icon
            name="check"
            className="mx-auto size-4 text-success"
            title={t('kadr.is_active')}
          />
        ) : null,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <RowActions
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row.id)}
          deleting={isDeleting && deleteId === row.id}
        />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('nav.employees')}
        count={meta.total}
        busy={isFetching}
        actions={
          <Button icon="plus" onClick={handleCreate}>
            {t('common.create')}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <SearchInput
          clearLabel={t('common.clear_search')}
            label={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder={t('common.search')}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          {t('kadr.active')}
          <Badge tone="success">{meta.active}</Badge>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        rowKey={(row) => row.id}
        loading={isFetching}
        emptyMessage={search ? t('common.nothing_found') : t('common.no_data')}
        emptyDescription={search ? t('common.nothing_found_hint') : t('common.no_records_hint')}
        emptyAction={
          search ? (
            <Button variant="secondary" onClick={() => setSearch('')}>
              {t('ucheb_students.clear_search')}
            </Button>
          ) : (
            <Button icon="plus" onClick={handleCreate}>
              {t('common.create')}
            </Button>
          )
        }
      />

      <EmployeeForm
        open={formOpen}
        onClose={handleCloseForm}
        departments={departments}
        positions={positions}
        formaList={formaList}
        shtatnostList={shtatnostList}
        editRow={editRow}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('kadr.confirm_delete_employee')}
        confirmText={t('common.yes')}
        cancelText={t('common.no')}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
