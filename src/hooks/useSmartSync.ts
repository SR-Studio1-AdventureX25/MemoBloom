import { useEffect, useCallback, useState, useMemo } from 'react'
import { useAppStore } from '@/store'
import { syncService, startWateringRecordSync, getFailedSyncCount, hasPendingSync, restartPendingSyncs, cleanup } from '@/services/syncService'

export interface SyncState {
  isSyncing: boolean
  lastSyncTime: number
  error?: string
  failedCount: number
}

export function useSmartSync() {
  const { isOnline, lastGlobalSync, addNotification, plants, wateringRecords, getSyncStatus } = useAppStore()
  
  // 计算全局同步状态
  const syncState = useMemo((): SyncState => {
    // 检查是否有任何数据正在同步
    const isSyncing = hasPendingSync()
    
    // 获取失败的同步记录数量
    const failedCount = getFailedSyncCount()
    
    // 获取同步错误（取第一个错误）
    const plantErrors = plants.map(plant => getSyncStatus(plant.id, 'plant').error).filter(Boolean)
    const recordErrors = wateringRecords.map(record => getSyncStatus(record.id, 'watering').error).filter(Boolean)
    const error = [...plantErrors, ...recordErrors][0]
    
    return {
      isSyncing,
      lastSyncTime: lastGlobalSync,
      error,
      failedCount
    }
  }, [plants, wateringRecords, lastGlobalSync, getSyncStatus])

  // 启动浇水记录同步
  const startWateringSync = useCallback((recordId: string) => {
    if (!isOnline) {
      console.log('网络离线，跳过浇水记录同步')
      return
    }

    startWateringRecordSync(recordId)
  }, [isOnline])

  // 手动重试失败的同步
  const retryFailedSyncs = useCallback(async () => {
    if (!isOnline) {
      addNotification({
        title: '网络离线',
        message: '请检查网络连接后重试',
        type: 'warning',
        read: false
      })
      return
    }

    const store = useAppStore.getState()
    const { plants, wateringRecords } = store

    let retryCount = 0

    // 重试失败的浇水记录
    for (const record of wateringRecords) {
      const status = getSyncStatus(record.id, 'watering')
      if (status.isFailed) {
        console.log(`重试失败的浇水记录同步: ${record.id}`)
        
        // 重置失败状态
        store.setSyncStatus(record.id, 'watering', {
          isFailed: false,
          retryCount: 0,
          error: undefined
        })
        
        // 重新启动同步
        startWateringRecordSync(record.id)
        retryCount++
      }
    }

    // 重试失败的植物记录
    for (const plant of plants) {
      const status = getSyncStatus(plant.id, 'plant')
      if (status.isFailed) {
        console.log(`重试失败的植物同步: ${plant.id}`)
        
        // 重置失败状态
        store.setSyncStatus(plant.id, 'plant', {
          isFailed: false,
          error: undefined
        })
        
        // 重新启动同步
        try {
          await syncService.syncSinglePlant(plant.id)
          retryCount++
        } catch (error) {
          console.error(`重试植物同步失败: ${plant.id}`, error)
        }
      }
    }

    if (retryCount > 0) {
      addNotification({
        title: '重试同步',
        message: `已重新启动 ${retryCount} 个失败的同步任务`,
        type: 'info',
        read: false
      })
    } else {
      addNotification({
        title: '无需重试',
        message: '当前没有失败的同步任务',
        type: 'info',
        read: false
      })
    }
  }, [isOnline, addNotification, getSyncStatus])

  // 网络状态变化时重启待处理的同步
  useEffect(() => {
    if (isOnline) {
      // 网络恢复时，延迟1秒后重启待处理的同步
      const timer = setTimeout(() => {
        restartPendingSyncs()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isOnline])

  // 应用启动后重启待处理的同步
  useEffect(() => {
    // 应用启动3秒后重启待处理的同步
    const timer = setTimeout(() => {
      if (isOnline) {
        restartPendingSyncs()
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, []) // 只在组件挂载时执行一次

  // 清理定时器
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  return {
    syncState,
    startWateringSync,
    retryFailedSyncs
  }
}

// 浇水记录特定的同步hook
export function useWateringRecordSync(recordId?: string) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string>()
  const { isOnline, getSyncStatus } = useAppStore()

  // 获取同步状态
  const syncStatus = useMemo(() => {
    if (!recordId) return null
    return getSyncStatus(recordId, 'watering')
  }, [recordId, getSyncStatus])

  // 启动同步
  const startSync = useCallback(() => {
    if (!recordId || !isOnline) {
      return
    }

    startWateringRecordSync(recordId)
  }, [recordId, isOnline])

  // 监听同步状态变化
  useEffect(() => {
    if (syncStatus) {
      setIsSyncing(syncStatus.isSyncing)
      setError(syncStatus.error)
    }
  }, [syncStatus])

  return {
    isSyncing,
    error,
    isComplete: syncStatus?.isComplete || false,
    isFailed: syncStatus?.isFailed || false,
    retryCount: syncStatus?.retryCount || 0,
    maxRetries: syncStatus?.maxRetries || 10,
    startSync
  }
}

// 植物特定的同步hook
export function usePlantSync(plantId?: string) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string>()
  const { isOnline, getSyncStatus } = useAppStore()

  // 获取同步状态
  const syncStatus = useMemo(() => {
    if (!plantId) return null
    return getSyncStatus(plantId, 'plant')
  }, [plantId, getSyncStatus])

  // 启动同步
  const startSync = useCallback(async () => {
    if (!plantId || !isOnline) {
      return null
    }

    try {
      return await syncService.syncSinglePlant(plantId)
    } catch (error) {
      console.error(`植物同步失败: ${plantId}`, error)
      return null
    }
  }, [plantId, isOnline])

  // 监听同步状态变化
  useEffect(() => {
    if (syncStatus) {
      setIsSyncing(syncStatus.isSyncing)
      setError(syncStatus.error)
    }
  }, [syncStatus])

  return {
    isSyncing,
    error,
    isComplete: syncStatus?.isComplete || false,
    isFailed: syncStatus?.isFailed || false,
    startSync
  }
}
