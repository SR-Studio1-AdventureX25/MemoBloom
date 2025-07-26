import { useAppStore } from '@/store'
import { apiService } from './api'
import type { Plant, WateringRecord } from '@/types'

// 同步配置
const SYNC_CONFIG = {
  SYNC_INTERVAL: 5 * 60 * 1000, // 5分钟同步间隔
  MAX_RETRY_COUNT: 3,
  BATCH_SIZE: 5, // 批量同步大小
  // 新增 - 智能同步配置
  FORCE_EXPIRE_DURATION: 60 * 1000,    // 60秒强制过期期
  BASE_BACKOFF_DELAY: 2000,            // 2秒基础退避
  MAX_BACKOFF_DELAY: 60000,            // 60秒最大退避
  MAX_BACKOFF_LEVEL: 5,                // 最大退避等级
} as const

class SyncService {
  private plantSyncPromises = new Map<string, Promise<Plant | null>>()
  private wateringSyncPromises = new Map<string, Promise<WateringRecord | null>>()
  private isGlobalSyncing = false

  /**
   * 计算指数退避延迟时间
   */
  private calculateBackoffDelay(backoffLevel: number = 0): number {
    const delay = Math.min(
      SYNC_CONFIG.BASE_BACKOFF_DELAY * Math.pow(2, backoffLevel),
      SYNC_CONFIG.MAX_BACKOFF_DELAY
    )
    return delay
  }

  /**
   * 检查数据是否有变化
   */
  private hasDataChanged(localData: Plant | WateringRecord, serverData: Plant | WateringRecord): boolean {
    // 简单的数据变化检测，比较关键字段
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
   * 智能同步判断 - 新的同步逻辑
   */
  private needsSync(entity: Plant | WateringRecord, type: 'plant' | 'watering'): boolean {
    const now = Date.now()
    const store = useAppStore.getState()
    const syncStatus = store.getSyncStatus(entity.id, type)

    // 如果正在同步，不需要重复同步
    if (syncStatus.isSyncing) {
      return false
    }

    // 1. 检查是否在强制过期期间（60秒内）
    if (syncStatus.lastModified && 
        (now - syncStatus.lastModified) < SYNC_CONFIG.FORCE_EXPIRE_DURATION) {
      console.log(`实体在强制过期期间 [${entity.id}]: ${now - syncStatus.lastModified}ms ago`)
      return true // 60秒内强制过期
    }

    // 2. 检查指数退避时间
    if (syncStatus.nextSyncTime && now < syncStatus.nextSyncTime) {
      console.log(`实体在退避期间 [${entity.id}]: 还需等待 ${syncStatus.nextSyncTime - now}ms`)
      return false // 还在退避期间
    }

    // 3. 检查强制过期截止时间
    if (syncStatus.forceExpireUntil && now < syncStatus.forceExpireUntil) {
      console.log(`实体在强制过期截止时间内 [${entity.id}]: 还有 ${syncStatus.forceExpireUntil - now}ms`)
      return true // 在强制过期截止时间内
    }

    // 4. 常规过期检查
    const isExpired = !syncStatus.lastSync || 
                     (now - syncStatus.lastSync) > SYNC_CONFIG.SYNC_INTERVAL
    
    // 5. 检查同步状态是否完整
    const isSyncIncomplete = !syncStatus.isComplete

    // 6. 植物特定的检查
    if (type === 'plant') {
      const plant = entity as Plant
      const basicIncomplete = plant.syncStatus !== 'complete' || !plant.lastSyncTime
      
      const needSync = isExpired || isSyncIncomplete || basicIncomplete
      
      if (needSync) {
        console.log(`植物需要同步 [${entity.id}]:`, {
          isExpired,
          isSyncIncomplete,
          basicIncomplete,
          lastSync: syncStatus.lastSync,
          timeSinceLastSync: syncStatus.lastSync ? now - syncStatus.lastSync : 'never'
        })
      }
      
      return needSync
    }

    // 7. 浇水记录特定的检查
    if (type === 'watering') {
      const needSync = isExpired || isSyncIncomplete
      
      if (needSync) {
        console.log(`浇水记录需要同步 [${entity.id}]:`, {
          isExpired,
          isSyncIncomplete,
          lastSync: syncStatus.lastSync,
          timeSinceLastSync: syncStatus.lastSync ? now - syncStatus.lastSync : 'never'
        })
      }
      
      return needSync
    }

    return isExpired || isSyncIncomplete
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
    const currentSyncStatus = store.getSyncStatus(plantId, 'plant')
    const localPlant = store.plants.find(p => p.id === plantId)
    
    try {
      console.log(`开始同步植物: ${plantId}`)
      
      // 标记为同步中，记录开始时间
      store.setSyncStatus(plantId, 'plant', { 
        isSyncing: true, 
        error: undefined,
        lastSync: Date.now()  // 记录同步开始时间
      })

      // 从服务器获取最新数据
      const response = await apiService.plants.getById(plantId)
      const serverPlant: Plant = {
        ...response.data,
        lastSyncTime: Date.now(),
        syncStatus: 'complete'
      }

      // 检查数据是否有变化
      const hasChanged = localPlant ? this.hasDataChanged(localPlant, serverPlant) : true
      
      // 更新本地数据
      store.updatePlant(plantId, serverPlant)

      // 根据数据变化情况更新同步状态
      const now = Date.now()
      const baseSyncStatus = {
        isSyncing: false,
        isComplete: true,
        lastSync: now,
        error: undefined
      }

      if (hasChanged) {
        console.log(`植物数据有变化 [${plantId}]，重置退避等级`)
        // 数据有变化，重置退避等级，继续频繁同步
        store.setSyncStatus(plantId, 'plant', {
          ...baseSyncStatus,
          backoffLevel: 0,
          nextSyncTime: undefined
        })
      } else {
        console.log(`植物数据无变化 [${plantId}]，增加退避等级`)
        // 数据无变化，增加退避等级
        const newBackoffLevel = Math.min(
          (currentSyncStatus.backoffLevel || 0) + 1, 
          SYNC_CONFIG.MAX_BACKOFF_LEVEL
        )
        const backoffDelay = this.calculateBackoffDelay(newBackoffLevel)
        
        store.setSyncStatus(plantId, 'plant', {
          ...baseSyncStatus,
          backoffLevel: newBackoffLevel,
          nextSyncTime: now + backoffDelay
        })
        
        console.log(`植物 [${plantId}] 退避等级: ${newBackoffLevel}, 下次同步时间: ${backoffDelay}ms 后`)
      }

      console.log(`植物同步成功: ${plantId}`)
      return serverPlant

    } catch (error) {
      console.error(`植物同步失败: ${plantId}`, error)
      
      // 同步失败，增加退避等级
      const newBackoffLevel = Math.min(
        (currentSyncStatus.backoffLevel || 0) + 1, 
        SYNC_CONFIG.MAX_BACKOFF_LEVEL
      )
      const backoffDelay = this.calculateBackoffDelay(newBackoffLevel)
      const now = Date.now()
      
      store.setSyncStatus(plantId, 'plant', {
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        backoffLevel: newBackoffLevel,
        nextSyncTime: now + backoffDelay
      })

      console.log(`植物同步失败 [${plantId}] 退避等级: ${newBackoffLevel}, 下次重试时间: ${backoffDelay}ms 后`)
      return null
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
    const currentSyncStatus = store.getSyncStatus(recordId, 'watering')
    const localRecord = store.wateringRecords.find(r => r.id === recordId)
    
    try {
      console.log(`开始同步浇水记录: ${recordId}`)
      
      // 标记为同步中，记录开始时间
      store.setSyncStatus(recordId, 'watering', { 
        isSyncing: true, 
        error: undefined,
        lastSync: Date.now()  // 记录同步开始时间
      })

      // 从服务器获取最新数据
      const response = await apiService.watering.getRecordById(recordId)
      const serverRecord = response.data

      // 检查数据是否有变化
      const hasChanged = localRecord ? this.hasDataChanged(localRecord, serverRecord) : true
      
      // 更新本地数据
      store.updateWateringRecord(recordId, serverRecord)

      // 根据数据变化情况更新同步状态
      const now = Date.now()
      const baseSyncStatus = {
        isSyncing: false,
        isComplete: true,
        lastSync: now,
        error: undefined
      }

      if (hasChanged) {
        console.log(`浇水记录数据有变化 [${recordId}]，重置退避等级`)
        // 数据有变化，重置退避等级，继续频繁同步
        store.setSyncStatus(recordId, 'watering', {
          ...baseSyncStatus,
          backoffLevel: 0,
          nextSyncTime: undefined
        })
      } else {
        console.log(`浇水记录数据无变化 [${recordId}]，增加退避等级`)
        // 数据无变化，增加退避等级
        const newBackoffLevel = Math.min(
          (currentSyncStatus.backoffLevel || 0) + 1, 
          SYNC_CONFIG.MAX_BACKOFF_LEVEL
        )
        const backoffDelay = this.calculateBackoffDelay(newBackoffLevel)
        
        store.setSyncStatus(recordId, 'watering', {
          ...baseSyncStatus,
          backoffLevel: newBackoffLevel,
          nextSyncTime: now + backoffDelay
        })
        
        console.log(`浇水记录 [${recordId}] 退避等级: ${newBackoffLevel}, 下次同步时间: ${backoffDelay}ms 后`)
      }

      console.log(`浇水记录同步成功: ${recordId}`)
      return serverRecord

    } catch (error) {
      console.error(`浇水记录同步失败: ${recordId}`, error)
      
      // 同步失败，增加退避等级
      const newBackoffLevel = Math.min(
        (currentSyncStatus.backoffLevel || 0) + 1, 
        SYNC_CONFIG.MAX_BACKOFF_LEVEL
      )
      const backoffDelay = this.calculateBackoffDelay(newBackoffLevel)
      const now = Date.now()
      
      store.setSyncStatus(recordId, 'watering', {
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        backoffLevel: newBackoffLevel,
        nextSyncTime: now + backoffDelay
      })

      console.log(`浇水记录同步失败 [${recordId}] 退避等级: ${newBackoffLevel}, 下次重试时间: ${backoffDelay}ms 后`)
      return null
    }
  }

  /**
   * 智能同步：只同步需要的记录
   */
  async smartSync(): Promise<{ plantsUpdated: number; recordsUpdated: number }> {
    if (this.isGlobalSyncing) {
      console.log('全局同步已在进行中，跳过本次同步')
      return { plantsUpdated: 0, recordsUpdated: 0 }
    }

    this.isGlobalSyncing = true
    
    try {
      const store = useAppStore.getState()
      const { plants, wateringRecords } = store

      // 筛选需要同步的植物
      const plantsToSync = plants.filter(plant => this.needsSync(plant, 'plant'))
      
      // 筛选需要同步的浇水记录
      const recordsToSync = wateringRecords.filter(record => this.needsSync(record, 'watering'))

      console.log(`智能同步开始: ${plantsToSync.length} 个植物, ${recordsToSync.length} 个浇水记录`)

      // 分批同步植物
      let plantsUpdated = 0
      for (let i = 0; i < plantsToSync.length; i += SYNC_CONFIG.BATCH_SIZE) {
        const batch = plantsToSync.slice(i, i + SYNC_CONFIG.BATCH_SIZE)
        const results = await Promise.allSettled(
          batch.map(plant => this.syncSinglePlant(plant.id))
        )
        
        plantsUpdated += results.filter(result => 
          result.status === 'fulfilled' && result.value !== null
        ).length
      }

      // 分批同步浇水记录
      let recordsUpdated = 0
      for (let i = 0; i < recordsToSync.length; i += SYNC_CONFIG.BATCH_SIZE) {
        const batch = recordsToSync.slice(i, i + SYNC_CONFIG.BATCH_SIZE)
        const results = await Promise.allSettled(
          batch.map(record => this.syncSingleWateringRecord(record.id))
        )
        
        recordsUpdated += results.filter(result => 
          result.status === 'fulfilled' && result.value !== null
        ).length
      }

      // 更新全局同步时间
      store.setLastGlobalSync(Date.now())

      console.log(`智能同步完成: ${plantsUpdated} 个植物更新, ${recordsUpdated} 个记录更新`)
      return { plantsUpdated, recordsUpdated }

    } finally {
      this.isGlobalSyncing = false
    }
  }

  /**
   * 后台同步：延迟执行，不阻塞UI
   */
  backgroundSync(): void {
    // 使用 requestIdleCallback 在浏览器空闲时执行
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.smartSync().catch(error => {
          console.error('后台同步失败:', error)
        })
      })
    } else {
      // 降级到 setTimeout
      setTimeout(() => {
        this.smartSync().catch(error => {
          console.error('后台同步失败:', error)
        })
      }, 100)
    }
  }

  /**
   * 获取当前植物并确保同步
   */
  async getCurrentPlantWithSync(): Promise<Plant | null> {
    const store = useAppStore.getState()
    const { currentPlantId, plants } = store

    if (!currentPlantId) {
      return null
    }

    const currentPlant = plants.find(p => p.id === currentPlantId)
    if (!currentPlant) {
      return null
    }

    // 如果需要同步，立即同步当前植物
    if (this.needsSync(currentPlant, 'plant')) {
      const syncedPlant = await this.syncSinglePlant(currentPlantId)
      return syncedPlant || currentPlant
    }

    return currentPlant
  }

  /**
   * 标记实体数据已修改，触发强制过期
   */
  markEntityModified(entityId: string, type: 'plant' | 'watering'): void {
    const store = useAppStore.getState()
    const now = Date.now()
    
    console.log(`标记实体已修改 [${entityId}] (${type})`)
    
    store.setSyncStatus(entityId, type, {
      lastModified: now,
      forceExpireUntil: now + SYNC_CONFIG.FORCE_EXPIRE_DURATION,
      isComplete: false, // 标记为需要同步
      backoffLevel: 0, // 重置退避等级
      nextSyncTime: undefined // 清除退避时间
    })
  }

  /**
   * 批量标记植物和相关浇水记录已修改
   */
  markPlantAndRecordsModified(plantId: string, recordId?: string): void {
    // 标记植物已修改
    this.markEntityModified(plantId, 'plant')
    
    // 如果提供了浇水记录ID，也标记它已修改
    if (recordId) {
      this.markEntityModified(recordId, 'watering')
    }
    
    console.log(`批量标记修改完成: 植物[${plantId}]${recordId ? `, 浇水记录[${recordId}]` : ''}`)
  }

  /**
   * 清理过期的同步状态
   */
  cleanupExpiredSyncStatus(): void {
    // 这里可以实现清理逻辑，暂时留空
    // 因为需要修改store结构来支持批量清理
    console.log('清理过期同步状态 - 功能待实现')
  }
}

// 导出单例
export const syncService = new SyncService()

// 导出绑定的方法以保持this上下文
export const syncSinglePlant = syncService.syncSinglePlant.bind(syncService)
export const syncSingleWateringRecord = syncService.syncSingleWateringRecord.bind(syncService)
export const smartSync = syncService.smartSync.bind(syncService)
export const backgroundSync = syncService.backgroundSync.bind(syncService)
export const getCurrentPlantWithSync = syncService.getCurrentPlantWithSync.bind(syncService)
export const markEntityModified = syncService.markEntityModified.bind(syncService)
export const markPlantAndRecordsModified = syncService.markPlantAndRecordsModified.bind(syncService)
