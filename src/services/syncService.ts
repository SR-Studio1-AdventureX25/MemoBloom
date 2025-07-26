import { useAppStore } from '@/store'
import { apiService } from './api'
import type { Plant, WateringRecord } from '@/types'

// 同步配置
const SYNC_CONFIG = {
  WATERING_RETRY_INTERVAL: 60 * 1000, // 1分钟重试间隔
  MAX_RETRY_COUNT: 10,                 // 最大重试次数
  BATCH_SIZE: 5,                       // 批量同步大小
} as const

class SyncService {
  private wateringRetryTimers = new Map<string, NodeJS.Timeout>()
  private plantSyncPromises = new Map<string, Promise<Plant | null>>()
  private wateringSyncPromises = new Map<string, Promise<WateringRecord | null>>()

  /**
   * 检查浇水记录字段是否完整
   */
  private isWateringRecordComplete(record: WateringRecord): boolean {
    return !!(
      record.memoryText &&
      record.emotionTags &&
      record.emotionTags.length > 0 &&
      record.emotionIntensity !== undefined &&
      record.coreEvent &&
      record.growthIncrement !== undefined
    )
  }

  /**
   * 检查数据是否有变化
   */
  private hasDataChanged(localData: Plant | WateringRecord, serverData: Plant | WateringRecord): boolean {
    if ('variety' in localData && 'variety' in serverData) {
      // 植物数据比较
      const local = localData as Plant
      const server = serverData as Plant
      return (
        local.currentGrowthStage !== server.currentGrowthStage ||
        local.growthValue !== server.growthValue ||
        local.lastWateringTime !== server.lastWateringTime ||
        JSON.stringify(local.personalityTags) !== JSON.stringify(server.personalityTags)
      )
    } else {
      // 浇水记录数据比较
      const local = localData as WateringRecord
      const server = serverData as WateringRecord
      return (
        local.memoryText !== server.memoryText ||
        JSON.stringify(local.emotionTags) !== JSON.stringify(server.emotionTags) ||
        local.emotionIntensity !== server.emotionIntensity ||
        local.coreEvent !== server.coreEvent
      )
    }
  }

  /**
   * 同步单个浇水记录
   */
  async syncSingleWateringRecord(recordId: string): Promise<WateringRecord | null> {
    // 避免重复请求
    if (this.wateringSyncPromises.has(recordId)) {
      return this.wateringSyncPromises.get(recordId)!
    }

    const promise = this._syncWateringRecordInternal(recordId)
    this.wateringSyncPromises.set(recordId, promise)

    try {
      const result = await promise
      return result
    } finally {
      this.wateringSyncPromises.delete(recordId)
    }
  }

  private async _syncWateringRecordInternal(recordId: string): Promise<WateringRecord | null> {
    const store = useAppStore.getState()
    const localRecord = store.wateringRecords.find(r => r.id === recordId)
    
    if (!localRecord) {
      console.warn(`浇水记录不存在: ${recordId}`)
      return null
    }

    try {
      console.log(`开始同步浇水记录: ${recordId}`)
      
      // 标记为同步中
      store.setSyncStatus(recordId, 'watering', { 
        isSyncing: true, 
        error: undefined
      })

      // 从服务器获取最新数据
      const response = await apiService.watering.getRecordById(recordId)
      const serverRecord = response.data

      // 检查数据是否有变化
      const hasChanged = this.hasDataChanged(localRecord, serverRecord)
      
      if (hasChanged) {
        // 更新本地数据
        store.updateWateringRecord(recordId, serverRecord)
        console.log(`浇水记录数据已更新: ${recordId}`)
      }

      // 检查字段是否完整
      const isComplete = this.isWateringRecordComplete(serverRecord)
      
      // 更新同步状态
      store.setSyncStatus(recordId, 'watering', {
        isSyncing: false,
        isComplete,
        lastSync: Date.now(),
        error: undefined,
        retryCount: 0,
        isFailed: false
      })

      if (isComplete) {
        // 字段完整，清除重试定时器
        this.clearRetryTimer(recordId)
        console.log(`浇水记录同步完成: ${recordId}`)
        
        // 触发关联植物的同步
        this.triggerPlantSync(serverRecord.plantId)
      } else {
        // 字段不完整，启动重试机制
        this.scheduleWateringRecordRetry(recordId)
        console.log(`浇水记录字段不完整，将重试: ${recordId}`)
      }

      return hasChanged ? serverRecord : localRecord

    } catch (error) {
      console.error(`浇水记录同步失败: ${recordId}`, error)
      
      const currentStatus = store.getSyncStatus(recordId, 'watering')
      const retryCount = (currentStatus.retryCount || 0) + 1
      const isFailed = retryCount >= SYNC_CONFIG.MAX_RETRY_COUNT
      
      store.setSyncStatus(recordId, 'watering', {
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        retryCount,
        isFailed
      })

      if (!isFailed) {
        // 还可以重试，安排下次重试
        this.scheduleWateringRecordRetry(recordId)
        console.log(`浇水记录同步失败，将重试 (${retryCount}/${SYNC_CONFIG.MAX_RETRY_COUNT}): ${recordId}`)
      } else {
        // 超过最大重试次数，停止重试
        this.clearRetryTimer(recordId)
        console.error(`浇水记录同步失败，已停止重试: ${recordId}`)
      }

      return null
    }
  }

  /**
   * 安排浇水记录重试
   */
  private scheduleWateringRecordRetry(recordId: string): void {
    // 清除现有定时器
    this.clearRetryTimer(recordId)
    
    const store = useAppStore.getState()
    const nextRetryTime = Date.now() + SYNC_CONFIG.WATERING_RETRY_INTERVAL
    
    // 更新下次重试时间
    store.setSyncStatus(recordId, 'watering', { nextRetryTime })
    
    // 设置新的定时器
    const timer = setTimeout(() => {
      this.syncSingleWateringRecord(recordId)
    }, SYNC_CONFIG.WATERING_RETRY_INTERVAL)
    
    this.wateringRetryTimers.set(recordId, timer)
    console.log(`已安排浇水记录重试: ${recordId}, 1分钟后执行`)
  }

  /**
   * 清除重试定时器
   */
  private clearRetryTimer(recordId: string): void {
    const timer = this.wateringRetryTimers.get(recordId)
    if (timer) {
      clearTimeout(timer)
      this.wateringRetryTimers.delete(recordId)
    }
  }

  /**
   * 同步单个植物
   */
  async syncSinglePlant(plantId: string): Promise<Plant | null> {
    // 避免重复请求
    if (this.plantSyncPromises.has(plantId)) {
      return this.plantSyncPromises.get(plantId)!
    }

    const promise = this._syncPlantInternal(plantId)
    this.plantSyncPromises.set(plantId, promise)

    try {
      const result = await promise
      return result
    } finally {
      this.plantSyncPromises.delete(plantId)
    }
  }

  private async _syncPlantInternal(plantId: string): Promise<Plant | null> {
    const store = useAppStore.getState()
    const localPlant = store.plants.find(p => p.id === plantId)
    
    if (!localPlant) {
      console.warn(`植物不存在: ${plantId}`)
      return null
    }

    try {
      console.log(`开始同步植物: ${plantId}`)
      
      // 标记为同步中
      store.setSyncStatus(plantId, 'plant', { 
        isSyncing: true, 
        error: undefined
      })

      // 从服务器获取最新数据
      const response = await apiService.plants.getById(plantId)
      const serverPlant: Plant = {
        ...response.data,
        lastSyncTime: Date.now(),
        syncStatus: 'complete'
      }

      // 检查数据是否有变化
      const hasChanged = this.hasDataChanged(localPlant, serverPlant)
      
      if (hasChanged) {
        // 更新本地数据
        store.updatePlant(plantId, serverPlant)
        console.log(`植物数据已更新: ${plantId}`)
      }

      // 植物记录不需要检查字段完整性，直接标记为完成
      store.setSyncStatus(plantId, 'plant', {
        isSyncing: false,
        isComplete: true,
        lastSync: Date.now(),
        error: undefined,
        isFailed: false
      })

      console.log(`植物同步完成: ${plantId}`)
      return hasChanged ? serverPlant : localPlant

    } catch (error) {
      console.error(`植物同步失败: ${plantId}`, error)
      
      store.setSyncStatus(plantId, 'plant', {
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        isFailed: true
      })

      return null
    }
  }

  /**
   * 触发植物同步（当相关浇水记录更新时）
   */
  private triggerPlantSync(plantId: string): void {
    // 延迟执行，避免阻塞当前同步流程
    setTimeout(() => {
      this.syncSinglePlant(plantId).catch(error => {
        console.error(`触发植物同步失败: ${plantId}`, error)
      })
    }, 100)
  }

  /**
   * 启动浇水记录的自动同步
   */
  startWateringRecordSync(recordId: string): void {
    const store = useAppStore.getState()
    const record = store.wateringRecords.find(r => r.id === recordId)
    
    if (!record) {
      console.warn(`浇水记录不存在，无法启动同步: ${recordId}`)
      return
    }

    // 检查字段是否完整
    if (this.isWateringRecordComplete(record)) {
      console.log(`浇水记录字段已完整，无需同步: ${recordId}`)
      store.setSyncStatus(recordId, 'watering', {
        isComplete: true,
        isFailed: false,
        retryCount: 0
      })
      return
    }

    // 初始化同步状态
    store.setSyncStatus(recordId, 'watering', {
      isComplete: false,
      isFailed: false,
      retryCount: 0,
      maxRetries: SYNC_CONFIG.MAX_RETRY_COUNT,
      lastModified: Date.now()
    })

    // 立即开始第一次同步
    this.syncSingleWateringRecord(recordId)
  }

  /**
   * 获取失败的同步记录数量
   */
  getFailedSyncCount(): number {
    const store = useAppStore.getState()
    const { plants, wateringRecords } = store

    let failedCount = 0

    // 统计失败的植物同步
    plants.forEach(plant => {
      const status = store.getSyncStatus(plant.id, 'plant')
      if (status.isFailed) {
        failedCount++
      }
    })

    // 统计失败的浇水记录同步
    wateringRecords.forEach(record => {
      const status = store.getSyncStatus(record.id, 'watering')
      if (status.isFailed) {
        failedCount++
      }
    })

    return failedCount
  }

  /**
   * 检查是否有正在进行的同步
   */
  hasPendingSync(): boolean {
    const store = useAppStore.getState()
    const { plants, wateringRecords } = store

    // 检查植物同步状态
    const hasPlantSync = plants.some(plant => {
      const status = store.getSyncStatus(plant.id, 'plant')
      return status.isSyncing
    })

    // 检查浇水记录同步状态
    const hasWateringSync = wateringRecords.some(record => {
      const status = store.getSyncStatus(record.id, 'watering')
      return status.isSyncing
    })

    return hasPlantSync || hasWateringSync
  }

  /**
   * 清理所有定时器（应用关闭时调用）
   */
  cleanup(): void {
    this.wateringRetryTimers.forEach((timer, recordId) => {
      clearTimeout(timer)
      console.log(`清理浇水记录重试定时器: ${recordId}`)
    })
    this.wateringRetryTimers.clear()
  }

  /**
   * 重新启动所有未完成的浇水记录同步（应用启动时调用）
   */
  restartPendingSyncs(): void {
    const store = useAppStore.getState()
    const { wateringRecords } = store

    wateringRecords.forEach(record => {
      const status = store.getSyncStatus(record.id, 'watering')
      
      // 如果记录不完整且未失败，重新启动同步
      if (!status.isComplete && !status.isFailed && !this.isWateringRecordComplete(record)) {
        console.log(`重新启动浇水记录同步: ${record.id}`)
        this.startWateringRecordSync(record.id)
      }
    })
  }
}

// 导出单例
export const syncService = new SyncService()

// 导出绑定的方法以保持this上下文
export const syncSinglePlant = syncService.syncSinglePlant.bind(syncService)
export const syncSingleWateringRecord = syncService.syncSingleWateringRecord.bind(syncService)
export const startWateringRecordSync = syncService.startWateringRecordSync.bind(syncService)
export const getFailedSyncCount = syncService.getFailedSyncCount.bind(syncService)
export const hasPendingSync = syncService.hasPendingSync.bind(syncService)
export const restartPendingSyncs = syncService.restartPendingSyncs.bind(syncService)
export const cleanup = syncService.cleanup.bind(syncService)
