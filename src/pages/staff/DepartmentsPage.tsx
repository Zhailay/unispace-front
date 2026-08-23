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
import Button from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Field'
import Spinner from '@/shared/ui/Spinner'

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
      <div
        className="flex items-center border border-t-0 border-border text-sm hover:bg-bg/50"
        style={{ paddingLeft: depth * 20 + 8 }}
      >
        <div className="flex-[2] flex items-center gap-1 py-1.5 pr-2 min-w-0">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(node.id)}
              className="w-5 shrink-0 text-muted hover:text-fg"
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <span className="truncate">{departmentName(node, lang)}</span>
        </div>
        <div className="flex-1 text-center py-1.5 border-l border-border">
          {node.vidName || ''}
        </div>
        <div className="w-16 text-center py-1.5 border-l border-border">
          {node.status ? '✓' : ''}
        </div>
        <div className="w-12 text-center py-1.5 border-l border-border">
          {node.nomer ?? ''}
        </div>
        <div className="w-40 flex justify-center gap-1 py-1.5 border-l border-border">
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => onEdit(node)}>
            {t('common.edit')}
          </Button>
          <Button
            variant="danger"
            className="px-2 py-1 text-xs"
            loading={isDeleting && deleteId === node.id}
            onClick={() => onDelete(node.id)}
          >
            {t('common.delete')}
          </Button>
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

  const departments = pageData?.data.departments
  const vidList = pageData?.data.vidList ?? []
  const meta = pageData?.data.meta ?? { total: 0, active: 0 }

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{t('nav.departments')}</h1>
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
            label={t('nav.departments')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
          />
        </div>
      </div>

      {/* Tree header */}
      <div className="flex bg-surface-alt border border-border font-semibold text-sm text-center">
        <div className="flex-[2] py-2 px-2">{t('kadr.name')}</div>
        <div className="flex-1 py-2 border-l border-border">{t('kadr.type')}</div>
        <div className="w-16 py-2 border-l border-border">{t('kadr.active_short')}</div>
        <div className="w-12 py-2 border-l border-border">№</div>
        <div className="w-40 py-2 border-l border-border">{t('common.actions')}</div>
      </div>

      {/* Tree content */}
      <div className="border-t border-border">
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
      </div>

      {/* Orphans section */}
      {tree.orphans.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-muted mt-4">{t('kadr.orphan_departments')}</h3>
          <div className="flex bg-surface-alt border border-border font-semibold text-sm text-center">
            <div className="flex-[2] py-2 px-2">{t('kadr.name')}</div>
            <div className="flex-1 py-2 border-l border-border">{t('kadr.type')}</div>
            <div className="w-16 py-2 border-l border-border">{t('kadr.active_short')}</div>
            <div className="w-12 py-2 border-l border-border">№</div>
            <div className="w-40 py-2 border-l border-border">{t('common.actions')}</div>
          </div>
          <div className="border-t border-border">
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
        </>
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
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
      />
    </div>
  )
}
