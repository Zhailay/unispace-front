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
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import { SearchInput } from '@/shared/ui/Field'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'

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

  // Статус приходит числом; null означает «не задан» — тогда бейдж не рисуем.
  function renderStatus(status: number | null) {
    if (status === 1) return <Badge tone="success">{t('ucheb_students.active')}</Badge>
    if (status === 0) return <Badge>{t('ucheb_students.inactive')}</Badge>
    return null
  }

  const columns: Column<StudentRow>[] = [
    {
      key: 'iin',
      header: t('ucheb_students.iin'),
      className: 'tabular font-medium whitespace-nowrap',
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
      className: 'text-muted',
      render: (row) => row.out_student_email ?? '',
    },
    {
      key: 'login',
      header: t('ucheb_students.login'),
      className: 'text-muted whitespace-nowrap',
      render: (row) => row.out_student_password_login ?? '',
    },
    {
      key: 'status',
      header: t('ucheb_students.status'),
      render: (row) => renderStatus(row.out_gruppa_student_status),
    },
    {
      key: 'actions',
      header: t('ucheb_students.actions'),
      align: 'right',
      className: 'w-px',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            icon="key"
            onClick={() => handlePasswordClick(row.out_student_id)}
            title={t('ucheb_students.password')}
            aria-label={t('ucheb_students.password')}
          />
          <RowActions
            onEdit={() => handleEdit(row)}
            onDelete={() => handleDeleteClick(row.out_student_id)}
            deleting={isDeleting && deleteId === row.out_student_id}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('ucheb_students.menu_name')}
        count={total}
        busy={isFetching || isPageLoading}
        actions={
          <Button icon="plus" onClick={handleCreate} disabled={isPageLoading}>
            {t('ucheb_students.create')}
          </Button>
        }
      />

      {/* Поиск применяется по Enter или кнопке — так было и до редизайна. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:max-w-xs">
          <SearchInput
          clearLabel={t('common.clear_search')}
            label={t('common.search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            onClear={handleClearSearch}
            placeholder={t('ucheb_students.search')}
          />
        </div>
        <Button icon="search" variant="secondary" onClick={handleSearch}>
          {t('common.search')}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_student_id}
        loading={isFetching || isPageLoading}
        emptyMessage={search ? t('common.nothing_found') : t('common.no_data')}
        emptyDescription={search ? t('common.nothing_found_hint') : t('common.no_records_hint')}
        emptyAction={
          search ? (
            <Button variant="secondary" onClick={handleClearSearch}>
              {t('ucheb_students.clear_search')}
            </Button>
          ) : (
            <Button icon="plus" onClick={handleCreate} disabled={isPageLoading}>
              {t('ucheb_students.create')}
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
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
