import type { 
  AppState, 
  Plant, 
  WateringRecord, 
  OfflineWateringItem
} from '@/types'

// Store Actions接口定义
export interface AppActions {
  // 植物相关
  setPlants: (plants: Plant[]) => void
  addPlant: (plant: Plant) => void
  updatePlant: (id: string, updates: Partial<Plant>) => void
  removePlant: (id: string) => void
  setCurrentPlantId: (plantId: string | null) => void
  
  // 浇水记录相关
  setWateringRecords: (records: WateringRecord[]) => void
  addWateringRecord: (record: WateringRecord) => void
  updateWateringRecord: (id: string, updates: Partial<WateringRecord>) => void
  
  // 离线队列相关
  addToOfflineQueue: (item: OfflineWateringItem) => void
  removeFromOfflineQueue: (id: string) => void
  updateOfflineQueueItem: (id: string, updates: Partial<OfflineWateringItem>) => void
  clearOfflineQueue: () => void
  
  // 网络状态
  setOnlineStatus: (status: boolean) => void
  
  // 通知相关
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'createdAt'>) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
  
  // 视频播放列表相关
  setVideoPlaylist: (playlist: string[]) => void
  setCurrentVideoIndex: (index: number) => void
  updateVideoPlaylist: (playlist: string[]) => void
}

// Store完整类型（状态 + 动作）
export type AppStore = AppState & AppActions
