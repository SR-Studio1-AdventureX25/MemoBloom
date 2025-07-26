import { useAppStore } from '@/store'
import { apiService } from './api'
import type { Plant, WateringRecord } from '@/types'

// 同步配置
const SYNC_CONFIG = {
  WATERING_RETRY_INTERVAL: 60 * 1000, // 1分钟重试间隔
  MAX_RETRY_COUNT: 10,                 // 最大重试次数
} as const

class SyncService {
  private wateringRetryTimers = new Map<string, NodeJS.Timeout>()
  private plantSyncPromises = new Map<string, Promise<Plant | null>>()

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
    const store = useAppStore.getState()
    const localRecord = store.wateringRecords.find(r => r.id === recordId)
    
    if (!localRecord) {
      console.warn(`浇水记录不存在: ${recordId}`)
      return null
    }

    try {
      console.log(`开始同步浇水记录: ${recordId}`)

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
      
      // 安排重试
      this.scheduleWateringRecordRetry(recordId)
      return null
    }
  }

  /**
   * 安排浇水记录重试
   */
  private scheduleWateringRecordRetry(recordId: string): void {
    // 清除现有定时器
    this.clearRetryTimer(recordId)
    
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

      console.log(`植物同步完成: ${plantId}`)
      return hasChanged ? serverPlant : localPlant

    } catch (error) {
      console.error(`植物同步失败: ${plantId}`, error)
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
      return
    }

    // 立即开始第一次同步
    this.syncSingleWateringRecord(recordId)
  }

  /**
   * 执行完整的数据同步
   */
  async performFullSync() {
    const store = useAppStore.getState()
    const { plants, wateringRecords } = store

    console.log('开始执行完整数据同步...')
    
    try {
      // 同步植物数据 - 逐个从服务器获取最新状态
      for (const plant of plants) {
        try {
          await this.syncSinglePlant(plant.id)
        } catch (error) {
          console.warn(`植物 ${plant.id} 同步失败:`, error)
        }
      }
      
      // 同步浇水记录 - 逐个从服务器获取最新状态
      for (const record of wateringRecords) {
        try {
          await this.syncSingleWateringRecord(record.id)
        } catch (error) {
          console.warn(`浇水记录 ${record.id} 同步失败:`, error)
        }
      }
      
      // 更新最后同步时间
      store.setLastGlobalSync(Date.now())
      
      console.log('完整数据同步完成')
      
    } catch (error) {
      console.error('完整数据同步失败:', error)
      throw error
    }
  }

  /**
   * 处理网络状态变化
   */
  handleNetworkChange(isOnline: boolean) {
    const store = useAppStore.getState()
    store.setOnlineStatus(isOnline)
    
    if (isOnline) {
      console.log('网络已连接，开始同步数据...')
      // 网络恢复时自动同步
      setTimeout(() => {
        this.performFullSync().catch(error => {
          console.error('网络恢复后同步失败:', error)
        })
      }, 1000) // 延迟1秒确保网络稳定
    } else {
      console.log('网络已断开')
    }
  }

  /**
   * 手动触发同步
   */
  async manualSync() {
    console.log('手动触发数据同步...')
    await this.performFullSync()
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
      // 如果记录不完整，重新启动同步
      if (!this.isWateringRecordComplete(record)) {
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
export const restartPendingSyncs = syncService.restartPendingSyncs.bind(syncService)
export const cleanup = syncService.cleanup.bind(syncService)
