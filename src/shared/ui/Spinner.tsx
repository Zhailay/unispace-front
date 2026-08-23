export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Загрузка"
      className={`inline-block size-5 animate-spin rounded-full border-2 border-border border-t-primary ${className}`}
    />
  )
}
