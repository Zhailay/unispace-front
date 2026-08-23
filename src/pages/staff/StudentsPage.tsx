import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteStudentMutation,
  useStudentsListQuery,
  useStudentsPageQuery,
  type StudentRow,
} from '@/features/students/studentsApi'
import StudentForm from '@/features/students/StudentForm'
import ChangePasswordForm from '@/features/students/ChangePasswordForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

export default function StudentsPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(0)

  // Form modal state
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<StudentRow | null>(null)

  // Password modal state
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [passwordStudentId, setPasswordStudentId] = useState<Id | null>(null)

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  // Load page data (dropdown lists)
  const { data: pageData, isLoading: isPageLoading } = useStudentsPageQuery()

  // Load students list
  const { data, isFetching } = useStudentsListQuery({
    search,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })
  const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation()

  const rows = data?.data ?? []
  const total = data?.totalCount ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  // Extract dropdown lists from page data
  const specList = pageData?.data?.spec_list ?? []
  const formaObuchList = pageData?.data?.forma_obuch_list ?? []
  const godList = pageData?.data?.god_list ?? []
  const kursList = pageData?.data?.kurs_list ?? []

  function handleSearch() {
    setSearch(searchInput)
    setPage(0)
  }

  function handleClearSearch() {
    setSearchInput('')
    setSearch('')
    setPage(0)
  }

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: StudentRow) {
    setEditRow(row)
    setFormOpen(true)
  }

  function handleCloseForm() {
    setFormOpen(false)
    setEditRow(null)
  }

  function handlePasswordClick(id: Id) {
    setPasswordStudentId(id)
    setPasswordOpen(true)
  }

  function handleClosePassword() {
    setPasswordOpen(false)
    setPasswordStudentId(null)
  }

  function handleDeleteClick(id: Id) {
    setDeleteId(id)
    setDeleteConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteId) return
    setDeleteConfirmOpen(false)
    const result = await deleteStudent(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.ok ? 'success' : 'error',
        result.error ??
          (result.ok ? t('ucheb_students.success_delete') : t('ucheb_students.error_connection')),
      ),
    )
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  function formatStatus(status: number | null): string {
    if (status === 1) return t('ucheb_students.active')
    if (status === 0) return t('ucheb_students.inactive')
    return ''
  }

  const columns: Column<StudentRow>[] = [
    {
      key: 'iin',
      header: t('ucheb_students.iin'),
      render: (row) => row.out_student_iin,
    },
    {
      key: 'familiya',
      header: t('ucheb_students.last_name'),
      render: (row) => row.out_student_familiya,
    },
    {
      key: 'imya',
      header: t('ucheb_students.first_name'),
      render: (row) => row.out_student_imya,
    },
    {
      key: 'otchestvo',
      header: t('ucheb_students.middle_name'),
      render: (row) => row.out_student_otchestvo,
    },
    {
      key: 'email',
      header: t('ucheb_students.email'),
      render: (row) => row.out_student_email ?? '',
    },
    {
      key: 'login',
      header: t('ucheb_students.login'),
      render: (row) => row.out_student_password_login ?? '',
    },
    {
      key: 'status',
      header: t('ucheb_students.status'),
      render: (row) => formatStatus(row.out_gruppa_student_status),
    },
    {
      key: 'actions',
      header: t('ucheb_students.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button variant="secondary" onClick={() => handlePasswordClick(row.out_student_id)}>
            {t('ucheb_students.password')}
          </Button>
          <Button
            variant="danger"
            loading={isDeleting && deleteId === row.out_student_id}
            onClick={() => handleDeleteClick(row.out_student_id)}
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
        <h1 className="text-xl font-semibold">{t('ucheb_students.menu_name')}</h1>
        {isFetching && <Spinner className="size-4" />}
        <span className="ml-auto text-sm text-muted">{total}</span>
      </div>

      <div className="flex items-end gap-3">
        <Input
          label={t('ucheb_students.search')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('common.search')}
          className="max-w-sm"
        />
        <Button onClick={handleSearch}>{t('ucheb_students.search')}</Button>
        <Button variant="secondary" onClick={handleClearSearch} title={t('ucheb_students.clear_search')}>
          X
        </Button>
        <Button onClick={handleCreate}>{t('ucheb_students.create')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_student_id}
        loading={isFetching}
      />

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

      <StudentForm
        open={formOpen}
        onClose={handleCloseForm}
        editRow={editRow}
        specList={specList}
        formaObuchList={formaObuchList}
        godList={godList}
        kursList={kursList}
      />

      <ChangePasswordForm
        open={passwordOpen}
        onClose={handleClosePassword}
        studentId={passwordStudentId}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('ucheb_students.confirm_delete')}
        confirmText={t('ucheb_students.yes')}
        cancelText={t('ucheb_students.no')}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
