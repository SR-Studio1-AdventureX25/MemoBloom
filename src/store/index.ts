import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { AppState, Plant, WateringRecord } from '@/types'
import type { AppStore } from './types'

// 初始状态
const initialState: AppState = {
  plants: [],
  currentPlantId: null,
  wateringRecords: [],
  isOnline: true,
  notifications: [],
  videoPlaylist: [],
  currentVideoIndex: 0,
  favoritePlants: [],
  favoriteWateringRecords: [],
  lastGlobalSync: 0,
  dailyBloomDraws: {},
  lastDrawDate: null
}

// 创建 Zustand store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

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
          plants: state.plants.filter(plant => plant.id !== id),
          currentPlantId: state.currentPlantId === id ? null : state.currentPlantId
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

        // Actions - 网络状态
        setOnlineStatus: (status: boolean) => set({ isOnline: status }),

        // Actions - 通知相关
        addNotification: (notification) => set((state) => ({
          notifications: [...state.notifications, {
            ...notification,
            id: Date.now().toString(),
            createdAt: new Date()
          }]
        })),
        
        markNotificationAsRead: (id: string) => set((state) => ({
          notifications: state.notifications.map(notif => 
            notif.id === id ? { ...notif, read: true } : notif
          )
        })),
        
        clearNotifications: () => set({ notifications: [] }),

        // Actions - 视频播放列表相关
        setVideoPlaylist: (playlist: string[]) => set({ videoPlaylist: playlist }),
        
        setCurrentVideoIndex: (index: number) => set({ currentVideoIndex: index }),
        
        updateVideoPlaylist: (playlist: string[]) => set({ videoPlaylist: playlist }),

        // Actions - 收藏植物相关
        addFavoritePlant: (plant: Plant) => set((state) => {
          // 检查是否已经收藏过这个植物
          const isAlreadyFavorited = state.favoritePlants.some(favPlant => favPlant.id === plant.id)
          if (isAlreadyFavorited) {
            return state // 如果已经收藏过，不做任何改变
          }
          return {
            favoritePlants: [...state.favoritePlants, plant]
          }
        }),
        
        removeFavoritePlant: (plantId: string) => set((state) => ({
          favoritePlants: state.favoritePlants.filter(plant => plant.id !== plantId)
        })),
        
        updateFavoritePlant: (id: string, updates: Partial<Plant>) => set((state) => ({
          favoritePlants: state.favoritePlants.map(plant => 
            plant.id === id ? { ...plant, ...updates } : plant
          )
        })),
        
        clearFavoritePlants: () => set({ favoritePlants: [] }),

        // Actions - 收藏浇水记录相关
        addFavoriteWateringRecord: (record: WateringRecord) => set((state) => {
          // 检查是否已经收藏过这个浇水记录
          const isAlreadyFavorited = state.favoriteWateringRecords.some(favRecord => favRecord.id === record.id)
          if (isAlreadyFavorited) {
            return state // 如果已经收藏过，不做任何改变
          }
          return {
            favoriteWateringRecords: [...state.favoriteWateringRecords, record]
          }
        }),
        
        removeFavoriteWateringRecord: (recordId: string) => set((state) => ({
          favoriteWateringRecords: state.favoriteWateringRecords.filter(record => record.id !== recordId)
        })),
        
        updateFavoriteWateringRecord: (id: string, updates: Partial<WateringRecord>) => set((state) => ({
          favoriteWateringRecords: state.favoriteWateringRecords.map(record => 
            record.id === id ? { ...record, ...updates } : record
          )
        })),
        
        clearFavoriteWateringRecords: () => set({ favoriteWateringRecords: [] }),

        // Actions - 简化的同步状态相关
        setLastGlobalSync: (timestamp: number) => set({ lastGlobalSync: timestamp }),

        // Actions - 开花抽取功能相关
        checkCanDrawMemory: (): boolean => {
          const state = get()
          const today = new Date().toDateString()
          const todayDraws = state.dailyBloomDraws[today] || 0
          return todayDraws < 3 // 每天最多3次
        },

        getTodayDrawCount: (): number => {
          const state = get()
          const today = new Date().toDateString()
          return state.dailyBloomDraws[today] || 0
        },

        performMemoryDraw: (): WateringRecord | null => {
          const state = get()
          const { wateringRecords, checkCanDrawMemory } = state
          
          if (!checkCanDrawMemory()) {
            return null
          }

          // 获取有效的浇水记录（有回忆内容的）
          const validRecords = wateringRecords.filter(record => 
            record.memoryText && record.memoryText.trim().length > 0
          )

          if (validRecords.length === 0) {
            return null
          }

          // 随机选择一个记录
          const randomIndex = Math.floor(Math.random() * validRecords.length)
          const selectedRecord = validRecords[randomIndex]

          // 更新抽取次数
          const today = new Date().toDateString()
          set((state) => ({
            dailyBloomDraws: {
              ...state.dailyBloomDraws,
              [today]: (state.dailyBloomDraws[today] || 0) + 1
            },
            lastDrawDate: today
          }))

          return selectedRecord
        },

        resetDailyDrawStatus: () => {
          const today = new Date().toDateString()
          set((state) => ({
            dailyBloomDraws: {
              ...state.dailyBloomDraws,
              [today]: 0
            }
          }))
        }
      }),
      {
        name: 'memo-bloom-storage',
        partialize: (state) => ({
          plants: state.plants,
          currentPlantId: state.currentPlantId,
          wateringRecords: state.wateringRecords,
          notifications: state.notifications,
          videoPlaylist: state.videoPlaylist,
          currentVideoIndex: state.currentVideoIndex,
          favoritePlants: state.favoritePlants,
          favoriteWateringRecords: state.favoriteWateringRecords,
          lastGlobalSync: state.lastGlobalSync,
          dailyBloomDraws: state.dailyBloomDraws,
          lastDrawDate: state.lastDrawDate
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Store 重新水化完成
            console.log('Store rehydrated successfully')
          }
        }
      }
    ),
    {
      name: 'memo-bloom-store'
    }
  )
)

// 导出选择器
export * from './selectors'
