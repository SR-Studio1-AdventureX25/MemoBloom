import type { Plant } from './plant'
import type { WateringRecord, OfflineWateringItem } from './watering'

// 资源缓存状态类型
export interface ResourceCacheStatus {
  isLoaded: boolean               // 是否已加载
  progress: number                // 加载进度 (0-100)
  error?: string                  // 错误信息
}

// 应用状态类型
export interface AppState {
  plants: Plant[]                 // 植物列表
  currentPlantId: string | null   // 当前植物ID
  wateringRecords: WateringRecord[] // 浇水记录
  offlineWateringQueue: OfflineWateringItem[] // 离线浇水队列
  isOnline: boolean               // 在线状态
  resourceCache: ResourceCacheStatus // 资源缓存状态
  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    read: boolean
    createdAt: Date
  }>
}
