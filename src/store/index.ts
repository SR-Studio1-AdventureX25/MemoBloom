import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { 
  AppState as AppStateType, 
  Plant, 
  WateringRecord, 
  OfflineWateringItem, 
  ResourceCacheStatus 
} from '@/types'

interface AppActions {
  
  // 植物相关
  setPlants: (plants: Plant[]) => void
  addPlant: (plant: Plant) => void
  updatePlant: (id: string, updates: Partial<Plant>) => void
  removePlant: (id: string) => void
  setCurrentPlant: (plant: Plant | null) => void
  
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
  
  // 资源缓存
  setResourceCache: (status: ResourceCacheStatus) => void
  updateResourceCacheProgress: (progress: number) => void
  
  // 通知相关
  addNotification: (notification: Omit<AppStateType['notifications'][0], 'id' | 'createdAt'>) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
}

// Selector functions for specific actions
export const useResourceCacheActions = () => useAppStore(
  (state) => ({
    setResourceCache: state.setResourceCache,
    updateResourceCacheProgress: state.updateResourceCacheProgress
  })
)

export const useNotificationActions = () => useAppStore(
  (state) => ({ addNotification: state.addNotification })
)

export const useOnlineActions = () => useAppStore(
  (state) => ({ setOnlineStatus: state.setOnlineStatus })
)

export const useAppStore = create<AppStateType & AppActions>()(
  devtools(
    persist(
      (set) => ({
        // State - 初始状态
        user: null,
        plants: [],
        currentPlant: null,
        wateringRecords: [],
        offlineWateringQueue: [],
        isOnline: true,
        resourceCache: {
          isLoaded: false,
          progress: 0
        },
        notifications: [],


        // Actions - 植物相关
        setPlants: (plants: Plant[]) => set({ plants }),
        
        addPlant: (plant: Plant) => set((state) => ({
          plants: [...state.plants, plant]
        })),
        
        updatePlant: (id: string, updates: Partial<Plant>) => set((state) => ({
          plants: state.plants.map(plant => 
            plant.id === id ? { ...plant, ...updates } : plant
          )
        })),
        
        removePlant: (id: string) => set((state) => ({
          plants: state.plants.filter(plant => plant.id !== id)
        })),

        setCurrentPlant: (plant: Plant | null) => set({ currentPlant: plant }),

        // Actions - 浇水记录相关
        setWateringRecords: (records: WateringRecord[]) => set({ wateringRecords: records }),

        addWateringRecord: (record: WateringRecord) => set((state) => ({
          wateringRecords: [...state.wateringRecords, record]
        })),

        updateWateringRecord: (id: string, updates: Partial<WateringRecord>) => set((state) => ({
          wateringRecords: state.wateringRecords.map(record =>
            record.id === id ? { ...record, ...updates } : record
          )
        })),

        // Actions - 离线队列相关
        addToOfflineQueue: (item: OfflineWateringItem) => set((state) => ({
          offlineWateringQueue: [...state.offlineWateringQueue, item]
        })),

        removeFromOfflineQueue: (id: string) => set((state) => ({
          offlineWateringQueue: state.offlineWateringQueue.filter(item => item.id !== id)
        })),

        updateOfflineQueueItem: (id: string, updates: Partial<OfflineWateringItem>) => set((state) => ({
          offlineWateringQueue: state.offlineWateringQueue.map(item =>
            item.id === id ? { ...item, ...updates } : item
          )
        })),

        clearOfflineQueue: () => set({ offlineWateringQueue: [] }),

        // Actions - 网络状态
        setOnlineStatus: (status: boolean) => set({ isOnline: status }),

        // Actions - 资源缓存
        setResourceCache: (status: ResourceCacheStatus) => set({ resourceCache: status }),

        updateResourceCacheProgress: (progress: number) => set((state) => ({
          resourceCache: { ...state.resourceCache, progress }
        })),

        // Actions - 通知相关
        addNotification: (notification: Omit<AppStateType['notifications'][0], 'id' | 'createdAt'>) => set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              createdAt: new Date()
            },
            ...state.notifications
          ]
        })),
        
        markNotificationAsRead: (id: string) => set((state) => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        })),
        
        clearNotifications: () => set({ notifications: [] })
      }),
      {
        name: 'memobloom-storage',
        partialize: (state) => ({
          plants: state.plants,
          currentPlant: state.currentPlant,
          wateringRecords: state.wateringRecords,
          notifications: state.notifications
        })
      }
    )
  )
)
