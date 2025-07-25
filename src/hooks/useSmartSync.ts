import { useEffect, useCallback, useState } from 'react'
import { useAppStore } from '@/store'
import { syncService } from '@/services/syncService'

export interface SyncState {
  isSyncing: boolean
  lastSyncTime: number
  error?: string
  plantsUpdated: number
  recordsUpdated: number
}

export function useSmartSync() {
  const { isOnline, lastGlobalSync, addNotification } = useAppStore()
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: lastGlobalSync,
    plantsUpdated: 0,
    recordsUpdated: 0
  })

  // 手动触发同步
  const triggerSync = useCallback(async () => {
    if (syncState.isSyncing) {
      console.log('同步已在进行中，跳过手动同步')
      return
    }

    if (!isOnline) {
      console.log('网络离线，跳过同步')
      return
    }

    setSyncState(prev => ({ ...prev, isSyncing: true, error: undefined }))

    try {
      const result = await syncService.smartSync()
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: Date.now(),
        plantsUpdated: result.plantsUpdated,
        recordsUpdated: result.recordsUpdated
      }))

      // 如果有更新，显示通知
      if (result.plantsUpdated > 0 || result.recordsUpdated > 0) {
        addNotification({
          title: '数据同步完成',
          message: `已更新 ${result.plantsUpdated} 个植物和 ${result.recordsUpdated} 条记录`,
          type: 'success',
          read: false
        })
      }

      console.log('智能同步完成:', result)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '同步失败'
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: errorMessage
      }))

      addNotification({
        title: '同步失败',
        message: errorMessage,
        type: 'error',
        read: false
      })

      console.error('同步失败:', error)
    }
  }, [syncState.isSyncing, isOnline, addNotification])

  // 后台同步
  const backgroundSync = useCallback(() => {
    if (!isOnline || syncState.isSyncing) {
      return
    }

    syncService.backgroundSync()
  }, [isOnline, syncState.isSyncing])

  // 网络状态变化时触发同步
  useEffect(() => {
    if (isOnline && !syncState.isSyncing) {
      // 网络恢复时，延迟1秒后触发同步
      const timer = setTimeout(() => {
        backgroundSync()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isOnline, syncState.isSyncing, backgroundSync])

  // 应用启动后的初始同步
  useEffect(() => {
    // 应用启动5秒后进行首次同步
    const timer = setTimeout(() => {
      if (isOnline && !syncState.isSyncing) {
        backgroundSync()
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, []) // 只在组件挂载时执行一次

  // 定期同步 (每10分钟)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && !syncState.isSyncing) {
        backgroundSync()
      }
    }, 10 * 60 * 1000) // 10分钟

    return () => clearInterval(interval)
  }, [isOnline, syncState.isSyncing, backgroundSync])

  return {
    syncState,
    triggerSync,
    backgroundSync
  }
}

// 植物特定的同步hook
export function usePlantSync(plantId?: string) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string>()
  const { isOnline } = useAppStore()

  const syncPlant = useCallback(async () => {
    if (!plantId || !isOnline || isSyncing) {
      return null
    }

    setIsSyncing(true)
    setError(undefined)

    try {
      const result = await syncService.syncSinglePlant(plantId)
      setIsSyncing(false)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setIsSyncing(false)
      return null
    }
  }, [plantId, isOnline, isSyncing])

  // 获取植物并确保同步
  const getPlantWithSync = useCallback(async () => {
    if (!plantId || !isOnline) {
      return null
    }

    return await syncService.getCurrentPlantWithSync()
  }, [plantId, isOnline])

  return {
    isSyncing,
    error,
    syncPlant,
    getPlantWithSync
  }
}

// 浇水记录特定的同步hook
export function useWateringRecordSync(recordId?: string) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string>()
  const { isOnline } = useAppStore()

  const syncRecord = useCallback(async () => {
    if (!recordId || !isOnline || isSyncing) {
      return null
    }

    setIsSyncing(true)
    setError(undefined)

    try {
      const result = await syncService.syncSingleWateringRecord(recordId)
      setIsSyncing(false)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      setIsSyncing(false)
      return null
    }
  }, [recordId, isOnline, isSyncing])

  return {
    isSyncing,
    error,
    syncRecord
  }
}
