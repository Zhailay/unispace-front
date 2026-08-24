import Modal from './Modal'
import Button from './Button'
import Icon from './Icon'
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
  /** Разрушительное действие — красная кнопка и предупреждающая иконка. */
  destructive?: boolean
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
  destructive = true,
}: Props) {
  const t = useT()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText ?? t('common.cancel')}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText ?? t('common.delete')}
          </Button>
        </div>
      }
    >
      <div className="flex gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full
            ${destructive ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info'}`}
        >
          <Icon name={destructive ? 'alert' : 'info'} className="size-5" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold">{title ?? t('common.confirm')}</h2>
          <p className="mt-1 text-sm text-muted">{message}</p>
        </div>
      </div>
    </Modal>
  )
}
