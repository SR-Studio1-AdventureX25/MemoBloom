import type { Plant } from './plant'
import type { WateringRecord } from './watering'

// 同步状态类型
export interface SyncStatus {
  lastSync: number
  isComplete: boolean
  isSyncing: boolean
  error?: string
  // 新增字段 - 智能同步和指数退避
  lastModified?: number        // 最后修改时间（创建/更新数据的时间）
  forceExpireUntil?: number    // 强制过期截止时间
  backoffLevel?: number        // 退避等级 (0, 1, 2, 3...)
  nextSyncTime?: number        // 下次允许同步的时间
}

// 应用状态类型
export interface AppState {
  plants: Plant[]                 // 植物列表
  currentPlantId: string | null   // 当前植物ID
  wateringRecords: WateringRecord[] // 浇水记录
  isOnline: boolean               // 在线状态
  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    read: boolean
    createdAt: Date
  }>
  videoPlaylist: string[]         // 视频播放列表 (长度为2)
  currentVideoIndex: number       // 当前播放的视频索引 (0或1)
  // 收藏功能
  favoritePlants: Plant[]         // 收藏的植物快照列表
  favoriteWateringRecords: WateringRecord[] // 收藏的浇水记录快照列表
  // 同步状态管理
  plantSyncStatus: Record<string, SyncStatus>  // 植物同步状态
  wateringRecordSyncStatus: Record<string, SyncStatus>  // 浇水记录同步状态
  lastGlobalSync: number          // 最后全局同步时间
  // 开花抽取功能
  dailyBloomDraws: Record<string, number> // 日期 -> 抽取次数
  lastDrawDate: string | null     // 最后抽取日期
}
