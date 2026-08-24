interface Props {
  className?: string
}

/**
 * Заглушка на время загрузки. В отличие от спиннера сохраняет высоту
 * блока — контент не «прыгает», когда данные приезжают.
 */
export default function Skeleton({ className = 'h-4 w-full' }: Props) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />
}
