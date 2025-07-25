import type { Plant } from './plant'
import type { WateringRecord, OfflineWateringItem } from './watering'

// 应用状态类型
export interface AppState {
  plants: Plant[]                 // 植物列表
  currentPlantId: string | null   // 当前植物ID
  wateringRecords: WateringRecord[] // 浇水记录
  offlineWateringQueue: OfflineWateringItem[] // 离线浇水队列
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
}
