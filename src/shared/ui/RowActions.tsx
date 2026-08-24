import Button from './Button'
import { useT } from '@/shared/i18n/useT'

interface Props {
  onEdit: () => void
  onDelete: () => void
  deleting?: boolean
}

/**
 * Действия в строке таблицы. Вынесены отдельно, чтобы «Редактировать/Удалить»
 * выглядели одинаково во всех справочниках — раньше каждая страница верстала
 * их по-своему.
 */
export default function RowActions({ onEdit, onDelete, deleting = false }: Props) {
  const t = useT()

  return (
    <div className="flex justify-end gap-1">
      <Button
        size="sm"
        variant="ghost"
        icon="pencil"
        onClick={onEdit}
        title={t('common.edit')}
        aria-label={t('common.edit')}
      />
      <Button
        size="sm"
        variant="ghost"
        icon="trash"
        loading={deleting}
        onClick={onDelete}
        title={t('common.delete')}
        aria-label={t('common.delete')}
        className="text-danger hover:bg-danger-soft hover:text-danger"
      />
    </div>
  )
}
