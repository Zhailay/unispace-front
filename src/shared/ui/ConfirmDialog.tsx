import Modal from './Modal'
import Button from './Button'
import { useT } from '@/shared/i18n/useT'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  loading = false,
}: Props) {
  const t = useT()

  return (
    <Modal open={open} onClose={onClose} title={title ?? t('common.confirm')}>
      <p className="mb-6 text-muted">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText ?? t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmText ?? t('common.delete')}
        </Button>
      </div>
    </Modal>
  )
}
