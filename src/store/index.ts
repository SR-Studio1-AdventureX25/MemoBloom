import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { AppState, Plant, WateringRecord, OfflineWateringItem } from '@/types'
import type { AppStore } from './types'

// 重新导出选择器函数以保持向后兼容性
export { useNotificationActions, useOnlineActions } from './selectors'

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // State - 初始状态（调试数据）
        plants: [
        ],
        currentPlantId: '',
        wateringRecords: [
        ],
        offlineWateringQueue: [],
        isOnline: true,
        notifications: [],
        videoPlaylist: ['plant-sprout-normal', 'plant-sprout-normal'], // 默认sprout阶段循环播放normal
        currentVideoIndex: 0,

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

        setCurrentPlantId: (plantId: string | null) => set({ currentPlantId: plantId }),

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

        // Actions - 通知相关
        addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'createdAt'>) => set((state) => ({
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
        
        clearNotifications: () => set({ notifications: [] }),

        // Actions - 视频播放列表相关
        setVideoPlaylist: (playlist: string[]) => set({ videoPlaylist: playlist }),

        setCurrentVideoIndex: (index: number) => set({ currentVideoIndex: index }),

        updateVideoPlaylist: (playlist: string[]) => set({ 
          videoPlaylist: playlist,
          currentVideoIndex: 0 // 重置到第一个视频
        })
      }),
      {
        name: 'memobloom-storage',
        partialize: (state) => ({
          plants: state.plants,
          currentPlantId: state.currentPlantId,
          wateringRecords: state.wateringRecords,
          notifications: state.notifications
        })
      }
    )
  )
)
