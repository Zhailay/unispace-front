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
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'

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
      render: (row) => row.podrazdelenieName ?? '',
    },
    {
      key: 'iin',
      header: t('kadr.iin'),
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
      render: (row) => row.formaZamescheniyaName ?? '',
    },
    {
      key: 'staffing',
      header: t('kadr.staffing'),
      render: (row) => row.shtatnostName ?? '',
    },
    {
      key: 'status',
      header: t('kadr.active_short'),
      render: (row) => (row.status ? '✓' : ''),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            className="px-2 py-1 text-xs"
            loading={isDeleting && deleteId === row.id}
            onClick={() => handleDeleteClick(row.id)}
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
        <h1 className="text-xl font-semibold">{t('nav.employees')}</h1>
        {isFetching && <Spinner className="size-4" />}
        <Button className="ml-auto" onClick={handleCreate}>
          {t('common.create')}
        </Button>
      </div>

      <div className="flex items-end gap-6">
        <div className="text-sm">
          {t('kadr.total')}: <b>{meta.total}</b>
        </div>
        <div className="text-sm">
          {t('kadr.active')}: <b>{meta.active}</b>
        </div>
        <div className="max-w-sm">
          <Input
            label={t('nav.employees')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        rowKey={(row) => row.id}
        loading={isFetching}
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
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
