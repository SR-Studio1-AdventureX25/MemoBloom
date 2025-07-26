import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/store'
import { startWateringRecordSync, restartPendingSyncs, cleanup } from '@/services/syncService'

export function useSmartSync() {
  const { isOnline } = useAppStore()

  // 启动浇水记录同步
  const startWateringSync = useCallback((recordId: string) => {
    startWateringRecordSync(recordId)
  }, [])

  // 应用启动后重启待处理的同步
  useEffect(() => {
    if (isOnline) {
      restartPendingSyncs()
    }
  }, [isOnline])

  // 清理定时器
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return {
    startWateringSync
  }
}
