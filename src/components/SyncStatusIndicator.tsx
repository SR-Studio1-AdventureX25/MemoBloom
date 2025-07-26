import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

interface SyncStatusIndicatorProps {
  className?: string
}

export default function SyncStatusIndicator({ className }: SyncStatusIndicatorProps) {
  const { isOnline } = useAppStore()

  // 简化版本：只显示在线状态
  if (!isOnline) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm', className)}>
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>离线</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm', className)}>
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span>在线</span>
    </div>
  )
}
