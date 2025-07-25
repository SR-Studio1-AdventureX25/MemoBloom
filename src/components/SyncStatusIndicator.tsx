import { useSmartSync } from '@/hooks/useSmartSync'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

interface SyncStatusIndicatorProps {
  className?: string
}

export default function SyncStatusIndicator({ className }: SyncStatusIndicatorProps) {
  const { syncState, triggerSync } = useSmartSync()
  const { isOnline } = useAppStore()

  // 不在线时不显示
  if (!isOnline) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm', className)}>
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span>离线模式</span>
      </div>
    )
  }

  // 同步中
  if (syncState.isSyncing) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm', className)}>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>同步中...</span>
      </div>
    )
  }

  // 同步错误
  if (syncState.error) {
    return (
      <button 
        onClick={triggerSync}
        className={cn('flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm hover:bg-orange-200 transition-colors', className)}
      >
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <span>同步失败，点击重试</span>
      </button>
    )
  }

  // 显示上次同步时间
  const lastSyncText = syncState.lastSyncTime > 0 
    ? `${Math.floor((Date.now() - syncState.lastSyncTime) / (1000 * 60))}分钟前同步`
    : '暂未同步'

  return (
    <button 
      onClick={triggerSync}
      className={cn('flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm hover:bg-green-200 transition-colors', className)}
    >
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span>{lastSyncText}</span>
    </button>
  )
}
