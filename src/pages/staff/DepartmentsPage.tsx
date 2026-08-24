import { useState, useMemo, useCallback } from 'react'
import { useAppDispatch } from '@/app/hooks'
import { toastPushed } from '@/features/ui/uiSlice'
import {
  useDepartmentsPageQuery,
  useDeleteDepartmentMutation,
  type DepartmentRow,
  type DepartmentTree,
  departmentName,
} from '@/features/kadr/kadrApi'
import DepartmentForm from '@/features/kadr/DepartmentForm'
import ConfirmDialog from '@/shared/ui/ConfirmDialog'
import type { Id } from '@/shared/types/api'
import { useT } from '@/shared/i18n/useT'
import { getLang } from '@/shared/i18n/lang'
import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import EmptyState from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/Field'
import Icon from '@/shared/ui/Icon'
import PageHeader from '@/shared/ui/PageHeader'
import RowActions from '@/shared/ui/RowActions'
import Skeleton from '@/shared/ui/Skeleton'

// Ширины колонок держим в одном месте: шапка и строки дерева должны
// совпадать пиксель в пиксель, иначе колонки разъезжаются на вложенности.
const COL_NAME = 'flex-[2] min-w-0'
const COL_TYPE = 'flex-1 min-w-0'
const COL_ACTIVE = 'w-16 shrink-0'
const COL_NOMER = 'w-14 shrink-0'
const COL_ACTIONS = 'w-24 shrink-0'

/** Шапка дерева — та же сетка колонок, что и у строк. */
function TreeHeader() {
  const t = useT()

  return (
    <div
      className="flex border-b border-border bg-surface-2 text-xs font-semibold
        tracking-wide text-muted uppercase"
    >
      <div className={`${COL_NAME} px-4 py-2.5`}>{t('kadr.name')}</div>
      <div className={`${COL_TYPE} px-4 py-2.5`}>{t('kadr.type')}</div>
      <div className={`${COL_ACTIVE} px-2 py-2.5 text-center`}>{t('kadr.active_short')}</div>
      <div className={`${COL_NOMER} px-2 py-2.5 text-center`}>{t('kadr.order_number')}</div>
      <div className={`${COL_ACTIONS} px-4 py-2.5 text-right`}>{t('common.actions')}</div>
    </div>
  )
}

interface TreeNodeProps {
  node: DepartmentRow & { children?: DepartmentRow[] }
  depth: number
  collapsed: Record<Id, boolean>
  onToggle: (id: Id) => void
  onEdit: (row: DepartmentRow) => void
  onDelete: (id: Id) => void
  isDeleting: boolean
  deleteId: Id | null
}

function TreeNode({ node, depth, collapsed, onToggle, onEdit, onDelete, isDeleting, deleteId }: TreeNodeProps) {
  const t = useT()
  const lang = getLang()
  const hasChildren = node.children && node.children.length > 0
  const isCollapsed = collapsed[node.id]

  return (
    <>
      <div className="flex items-center border-b border-border transition-colors last:border-0 hover:bg-surface-2">
        <div
          className={`${COL_NAME} flex items-center gap-1 py-1 pr-2 pl-2 text-sm`}
          // Отступ вложенности задаётся инлайном: уровней заранее не знаем,
          // а Tailwind генерирует только те классы, что есть в исходниках.
          style={{ paddingLeft: depth * 20 + 8 }}
        >
          {hasChildren ? (
            <Button
              size="sm"
              variant="ghost"
              icon={isCollapsed ? 'chevronRight' : 'chevronDown'}
              onClick={() => onToggle(node.id)}
              aria-label={departmentName(node, lang)}
              aria-expanded={!isCollapsed}
            />
          ) : (
            <span className="h-8 w-9 shrink-0" aria-hidden />
          )}
          <span className="truncate">{departmentName(node, lang)}</span>
        </div>
        <div className={`${COL_TYPE} truncate px-4 py-1 text-sm text-muted`}>
          {node.vidName || ''}
        </div>
        <div className={`${COL_ACTIVE} flex justify-center px-2 py-1`}>
          {node.status && (
            <Icon name="check" className="size-4 text-success" title={t('kadr.is_active')} />
          )}
        </div>
        <div className={`${COL_NOMER} tabular px-2 py-1 text-center text-sm text-muted`}>
          {node.nomer ?? ''}
        </div>
        <div className={`${COL_ACTIONS} px-2 py-1`}>
          <RowActions
            onEdit={() => onEdit(node)}
            onDelete={() => onDelete(node.id)}
            deleting={isDeleting && deleteId === node.id}
          />
        </div>
      </div>
      {hasChildren && !isCollapsed && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={isDeleting}
              deleteId={deleteId}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default function DepartmentsPage() {
  const t = useT()
  const dispatch = useAppDispatch()

  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editRow, setEditRow] = useState<DepartmentRow | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<Id | null>(null)
  const [collapsed, setCollapsed] = useState<Record<Id, boolean>>({})

  const { data: pageData, isFetching } = useDepartmentsPageQuery({ search })
  const [deleteDepartment, { isLoading: isDeleting }] = useDeleteDepartmentMutation()

  const departments = pageData?.data?.departments
  const vidList = pageData?.data?.vidList ?? []
  const meta = pageData?.data?.meta ?? { total: 0, active: 0 }

  // Build tree from flat list
  const tree = useMemo<DepartmentTree>(() => {
    if (!departments) return { roots: [], orphans: [] }

    const map: Record<Id, DepartmentRow & { children: DepartmentRow[] }> = {}
    const roots: (DepartmentRow & { children: DepartmentRow[] })[] = []
    const orphans: (DepartmentRow & { children: DepartmentRow[] })[] = []

    departments.forEach((d) => {
      map[d.id] = { ...d, children: [] }
    })

    departments.forEach((d) => {
      const node = map[d.id]
      if (!d.secondId || d.secondId === '0') {
        roots.push(node)
      } else if (map[d.secondId]) {
        map[d.secondId].children.push(node)
      } else {
        orphans.push(node)
      }
    })

    return { roots, orphans }
  }, [departments])

  const handleToggle = useCallback((id: Id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  function handleCreate() {
    setEditRow(null)
    setFormOpen(true)
  }

  function handleEdit(row: DepartmentRow) {
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
      await deleteDepartment(deleteId).unwrap()
      dispatch(toastPushed('success', t('kadr.department_deleted')))
    } catch {
      dispatch(toastPushed('error', t('common.error_connection')))
    }
    setDeleteId(null)
  }

  function handleDeleteCancel() {
    setDeleteConfirmOpen(false)
    setDeleteId(null)
  }

  // Первая загрузка — скелетоны вместо спиннера на всю страницу.
  const isInitialLoad = isFetching && !departments
  const isEmpty = !isFetching && tree.roots.length === 0 && tree.orphans.length === 0

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t('nav.departments')}
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

      <div className="table-scroll rounded-card border border-border bg-surface shadow-card">
        {isInitialLoad ? (
          <div className="flex flex-col gap-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={`sk-${i}`} className="h-6 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState
            title={search ? t('common.nothing_found') : t('common.no_data')}
            description={search ? t('common.nothing_found_hint') : t('common.no_records_hint')}
            action={
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
        ) : (
          <>
            <TreeHeader />
            {tree.roots.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                collapsed={collapsed}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isDeleting={isDeleting}
                deleteId={deleteId}
              />
            ))}
          </>
        )}
      </div>

      {/* Подразделения, чей родитель не найден в выборке — отдельным блоком */}
      {tree.orphans.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">{t('kadr.orphan_departments')}</h2>
          <div className="table-scroll rounded-card border border-border bg-surface shadow-card">
            <TreeHeader />
            {tree.orphans.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                collapsed={collapsed}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                isDeleting={isDeleting}
                deleteId={deleteId}
              />
            ))}
          </div>
        </section>
      )}

      <DepartmentForm
        open={formOpen}
        onClose={handleCloseForm}
        vidList={vidList}
        allDepartments={departments ?? []}
        editRow={editRow}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('common.delete')}
        message={t('kadr.confirm_delete_department')}
        confirmText={t('common.yes')}
        cancelText={t('common.no')}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
