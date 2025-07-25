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

  // 显示上次同步时间和结果
  const getLastSyncText = () => {
    if (syncState.lastSyncTime === 0) {
      return '暂未同步'
    }
    
    const minutesAgo = Math.floor((Date.now() - syncState.lastSyncTime) / (1000 * 60))
    const timeText = minutesAgo === 0 ? '刚刚同步' : `${minutesAgo}分钟前同步`
    
    // 如果有同步结果，显示更新数量
    if (syncState.plantsUpdated > 0 || syncState.recordsUpdated > 0) {
      const updateText = `(更新${syncState.plantsUpdated + syncState.recordsUpdated}项)`
      return `${timeText} ${updateText}`
    }
    
    return timeText
  }

  return (
    <button 
      onClick={triggerSync}
      className={cn('flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm hover:bg-green-200 transition-all duration-200', className)}
      title="点击手动同步"
    >
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span>{getLastSyncText()}</span>
    </button>
  )
}
