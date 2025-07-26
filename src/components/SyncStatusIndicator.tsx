import { useSmartSync } from '@/hooks/useSmartSync'
import { useAppStore } from '@/store'
import { cn } from '@/lib/utils'

interface SyncStatusIndicatorProps {
  className?: string
}

export default function SyncStatusIndicator({ className }: SyncStatusIndicatorProps) {
  const { syncState, retryFailedSyncs } = useSmartSync()
  const { isOnline } = useAppStore()

  // 不在线时不显示
  if (!isOnline) {
    return null
  }

  // 只有当存在失败的同步记录时才显示指示器
  if (syncState.failedCount === 0) {
    return null
  }

  // 同步中状态
  if (syncState.isSyncing) {
    return (
      <div className={cn('flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm', className)}>
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>同步中...</span>
      </div>
    )
  }

  // 显示失败的同步记录数量，点击可重试
  return (
    <button 
      onClick={retryFailedSyncs}
      className={cn(
        'flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm hover:bg-orange-200 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
        className
      )}
      title={`${syncState.failedCount} 个记录同步失败，点击重试`}
    >
      <div className="w-2 h-2 rounded-full bg-orange-500" />
      <span>{syncState.failedCount} 个记录同步失败</span>
      <svg 
        className="w-3 h-3 ml-1" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
    </button>
  )
}
