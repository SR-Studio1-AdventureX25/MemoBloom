import { useAppStore } from '@/store'
import { apiService } from './api'
import type { Plant, WateringRecord } from '@/types'

// 同步配置
const SYNC_CONFIG = {
  SYNC_INTERVAL: 5 * 60 * 1000, // 5分钟同步间隔
  MAX_RETRY_COUNT: 3,
  BATCH_SIZE: 5 // 批量同步大小
} as const

class SyncService {
  private plantSyncPromises = new Map<string, Promise<Plant | null>>()
  private wateringSyncPromises = new Map<string, Promise<WateringRecord | null>>()
  private isGlobalSyncing = false

  /**
   * 检查是否需要同步
   */
  private needsSync(entity: Plant | WateringRecord, type: 'plant' | 'watering'): boolean {
    const now = Date.now()
    const store = useAppStore.getState()
    const syncStatus = store.getSyncStatus(entity.id, type)

    // 如果正在同步，不需要重复同步
    if (syncStatus.isSyncing) {
      return false
    }

    // 如果有错误且距离上次同步时间不长，暂时不同步
    if (syncStatus.error && (now - syncStatus.lastSync) < SYNC_CONFIG.SYNC_INTERVAL / 2) {
      return false
    }

    // 检查是否过期
    const isExpired = !syncStatus.lastSync || (now - syncStatus.lastSync) > SYNC_CONFIG.SYNC_INTERVAL
    
    // 检查同步状态是否完整
    const isSyncIncomplete = !syncStatus.isComplete

    // 植物特定的检查
    if (type === 'plant') {
      const plant = entity as Plant
      
      // 基本同步状态检查
      const basicIncomplete = plant.syncStatus !== 'complete' || !plant.lastSyncTime
      
      // 数据完整性检查（放宽条件，允许某些字段为空）
      const dataIncomplete = false // 暂时禁用严格的数据完整性检查
      
      const needSync = isExpired || isSyncIncomplete || basicIncomplete || dataIncomplete
      
      // 只在需要同步时输出日志
      if (needSync) {
        console.log(`植物需要同步 [${entity.id}]:`, {
          isExpired,
          isSyncIncomplete,
          basicIncomplete
        })
      }
      
      return needSync
    }

    // 浇水记录特定的检查
    if (type === 'watering') {
      // 数据完整性检查（放宽条件）
      const dataIncomplete = false // 暂时禁用严格的数据完整性检查
      
      const needSync = isExpired || isSyncIncomplete || dataIncomplete
      
      // 只在需要同步时输出日志
      if (needSync) {
        console.log(`浇水记录需要同步 [${entity.id}]:`, {
          isExpired,
          isSyncIncomplete
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
      const updatedPlant: Plant = {
        ...response.data,
        lastSyncTime: Date.now(),
        syncStatus: 'complete'
      }

      // 更新本地数据
      store.updatePlant(plantId, updatedPlant)

      // 更新同步状态
      store.setSyncStatus(plantId, 'plant', {
        isSyncing: false,
        isComplete: true,
        lastSync: Date.now(),
        error: undefined
      })

      console.log(`植物同步成功: ${plantId}`)
      return updatedPlant

    } catch (error) {
      console.error(`植物同步失败: ${plantId}`, error)
      
      store.setSyncStatus(plantId, 'plant', {
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      })

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
      const updatedRecord = response.data

      // 更新本地数据
      store.updateWateringRecord(recordId, updatedRecord)

      // 更新同步状态
      store.setSyncStatus(recordId, 'watering', {
        isSyncing: false,
        isComplete: true,
        lastSync: Date.now(),
        error: undefined
      })

      console.log(`浇水记录同步成功: ${recordId}`)
      return updatedRecord

    } catch (error) {
      console.error(`浇水记录同步失败: ${recordId}`, error)
      
      store.setSyncStatus(recordId, 'watering', {
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      })

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

// 导出便捷方法
export const {
  syncSinglePlant,
  syncSingleWateringRecord,
  smartSync,
  backgroundSync,
  getCurrentPlantWithSync
} = syncService
