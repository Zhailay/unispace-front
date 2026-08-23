import { useState } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDeleteDisciplinaMutation,
  useDisciplinaPageQuery,
  useDisciplinaListQuery,
  type DisciplinaRow,
} from '@/features/disciplina/disciplinaApi'
import DisciplinaForm from '@/features/disciplina/DisciplinaForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import Button from '@/shared/ui/Button'
import { Input, Select } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'
import DataTable, { type Column } from '@/shared/ui/DataTable'
import Pagination from '@/shared/ui/Pagination'

const PAGE_SIZE = 10

export default function DisciplinaPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [filterPodrazdelenie, setFilterPodrazdelenie] = useState<Id | ''>('')

  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<DisciplinaRow | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)

  const { data: pageData } = useDisciplinaPageQuery()
  const { data, isFetching } = useDisciplinaListQuery({
    search,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    id_podrazdelenie: filterPodrazdelenie || undefined,
  })
  const [deleteDisciplina, { isLoading: isDeleting }] = useDeleteDisciplinaMutation()

  const rows = data?.data ?? []
  const total = data?.totalCount ?? 0
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)
  const podrazdelenieList = pageData?.data.podrazdelenie_list ?? []

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: DisciplinaRow) {
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
    const result = await deleteDisciplina(deleteId).unwrap()
    dispatch(
      toastPushed(
        result.success ? 'success' : 'error',
        result.message ??
          (result.success ? t('disciplina.success_delete') : t('disciplina.error_connection')),
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
    setFilterPodrazdelenie('')
    setPage(0)
  }

  const columns: Column<DisciplinaRow>[] = [
    {
      key: 'name_kz',
      header: t('disciplina.name_kz'),
      render: (row) => row.out_disciplina_kz,
    },
    {
      key: 'name_ru',
      header: t('disciplina.name_ru'),
      render: (row) => row.out_disciplina_ru,
    },
    {
      key: 'name_en',
      header: t('disciplina.name_en'),
      render: (row) => row.out_disciplina_en,
    },
    {
      key: 'kredit',
      header: t('disciplina.kredit'),
      render: (row) => row.out_disciplina_kredit ?? '',
    },
    {
      key: 'dop_info',
      header: t('disciplina.dop_info'),
      render: (row) => row.out_disciplina_opisanie ?? '',
    },
    {
      key: 'lk',
      header: t('disciplina.lk'),
      render: (row) => row.out_disciplina_lk ?? '',
    },
    {
      key: 'pz',
      header: t('disciplina.pz'),
      render: (row) => row.out_disciplina_pz ?? '',
    },
    {
      key: 'lz',
      header: t('disciplina.lz'),
      render: (row) => row.out_disciplina_lz ?? '',
    },
    {
      key: 'srs',
      header: t('disciplina.srs'),
      render: (row) => row.out_disciplina_srs ?? '',
    },
    {
      key: 'srsp',
      header: t('disciplina.srsp'),
      render: (row) => row.out_disciplina_srsp ?? '',
    },
    {
      key: 'pp',
      header: t('disciplina.pp'),
      render: (row) => row.out_disciplina_pp ?? '',
    },
    {
      key: 'lpz',
      header: t('disciplina.lpz'),
      render: (row) => row.out_disciplina_lpz ?? '',
    },
    {
      key: 'fz',
      header: t('disciplina.fz'),
      render: (row) => row.out_disciplina_fz ?? '',
    },
    {
      key: 'actions',
      header: t('disciplina.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            loading={isDeleting && deleteId === row.out_disciplina_id}
            onClick={() => handleDeleteClick(row.out_disciplina_id)}
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
        <h1 className="text-xl font-semibold">{t('disciplina.menu_name')}</h1>
        <Select
          label=""
          className="w-56"
          value={filterPodrazdelenie}
          onChange={(e) => {
            setFilterPodrazdelenie(e.target.value)
            setPage(0)
          }}
        >
          <option value="">{t('disciplina.all_podrazdelenie')}</option>
          {podrazdelenieList.map((item) => (
            <option key={String(item.podrazdelenie_id)} value={String(item.podrazdelenie_id)}>
              {item.podrazdelenie_name}
            </option>
          ))}
        </Select>
        {isFetching && <Spinner className="size-4" />}
        <span className="ml-auto text-sm text-muted">{total}</span>
      </div>

      <div className="flex items-end gap-3">
        <Input
          label={t('disciplina.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder={t('common.search')}
          className="max-w-sm"
        />
        <Button variant="secondary" onClick={handleClearSearch}>
          {t('common.clear')}
        </Button>
        <Button onClick={handleCreate}>{t('disciplina.create')}</Button>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(row) => row.out_disciplina_id}
        loading={isFetching}
      />

      <Pagination page={page} lastPage={lastPage} onPageChange={setPage} />

      <DisciplinaForm
        open={formOpen}
        onClose={handleCloseForm}
        podrazdelenieList={podrazdelenieList}
        editRow={editRow}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('disciplina.confirm_delete')}
        confirmText={t('disciplina.yes')}
        cancelText={t('disciplina.no')}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
