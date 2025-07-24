import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { AppState, Plant, WateringRecord, OfflineWateringItem, ResourceCacheStatus } from '@/types'
import type { AppStore } from './types'

// 重新导出选择器函数以保持向后兼容性
export { useResourceCacheActions, useNotificationActions, useOnlineActions } from './selectors'

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // State - 初始状态（调试数据）
        plants: [
          {
            id: 'plant-1',
            variety: 'sunflower',
            currentGrowthStage: 'sprout',
            growthValue: 25,
            lastWateringTime: '2025-01-24T10:30:00Z',
            userRecentStatus: '今天心情不错，工作顺利',
            personalityTags: ['乐观', '积极', '阳光'],
            nftMinted: false,
            createdAt: '2025-01-20T08:00:00Z'
          },
          {
            id: 'plant-2',
            variety: 'sunflower',
            currentGrowthStage: 'mature',
            growthValue: 75,
            lastWateringTime: '2025-01-23T15:45:00Z',
            userRecentStatus: '最近有点焦虑，但在努力调整',
            personalityTags: ['敏感', '细腻', '坚韧'],
            nftMinted: true,
            nftAddress: '0x1234567890abcdef1234567890abcdef12345678',
            nftWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            createdAt: '2025-01-15T12:00:00Z'
          }
        ],
        currentPlantId: 'plant-1',
        wateringRecords: [
          {
            id: 'record-1',
            plantId: 'plant-1',
            plantGrowthValue: 20,
            memoryText: '今天完成了一个重要的项目，感觉很有成就感',
            emotionTags: ['开心', '满足', '兴奋'],
            emotionIntensity: 8,
            growthIncrement: 5,
            coreEvent: '工作成就',
            nftMinted: false,
            wateringTime: '2025-01-24T10:30:00Z'
          },
          {
            id: 'record-2',
            plantId: 'plant-1',
            plantGrowthValue: 15,
            memoryText: '和朋友聊天很开心，分享了很多有趣的想法',
            emotionTags: ['愉快', '轻松'],
            emotionIntensity: 7,
            growthIncrement: 3,
            coreEvent: '社交互动',
            nftMinted: false,
            wateringTime: '2025-01-23T20:15:00Z'
          },
          {
            id: 'record-3',
            plantId: 'plant-2',
            plantGrowthValue: 70,
            memoryText: '今天学会了一个新技能，虽然过程有点困难但很有收获',
            emotionTags: ['困难', '坚持', '成长'],
            emotionIntensity: 6,
            growthIncrement: 4,
            coreEvent: '技能学习',
            nftMinted: true,
            nftAddress: '0x9876543210fedcba9876543210fedcba98765432',
            nftWalletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
            wateringTime: '2025-01-23T15:45:00Z',
            nftMintTime: '2025-01-23T16:00:00Z'
          }
        ],
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

        // Actions - 资源缓存
        setResourceCache: (status: ResourceCacheStatus) => set({ resourceCache: status }),

        updateResourceCacheProgress: (progress: number) => set((state) => ({
          resourceCache: { ...state.resourceCache, progress }
        })),

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
        
        clearNotifications: () => set({ notifications: [] })
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
