import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { AppState, Plant, WateringRecord, SyncStatus } from '@/types'
import type { AppStore } from './types'
import { apiService } from '@/services/api'
import { pwaService } from '@/services/pwa'

// 重新导出选择器函数以保持向后兼容性
export { useNotificationActions, useOnlineActions } from './selectors'

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State - 初始状态
        plants: [] as Plant[],
        currentPlantId: null,
        wateringRecords: [] as WateringRecord[],
        isOnline: true,
        notifications: [] as AppState['notifications'],
        videoPlaylist: ['plant-sprout-normal', 'plant-sprout-normal'], // 默认sprout阶段循环播放normal
        currentVideoIndex: 0,
        // 收藏功能
        favoritePlants: [] as Plant[],
        favoriteWateringRecords: [] as WateringRecord[],
        // 同步状态管理
        plantSyncStatus: {},
        wateringRecordSyncStatus: {},
        lastGlobalSync: 0,
        // 开花抽取功能
        dailyBloomDraws: {} as Record<string, number>, // 日期 -> 抽取次数
        lastDrawDate: null as string | null,

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

        addWateringRecord: (record: WateringRecord) => set((state) => {
          const now = Date.now()
          
          // 更新浇水记录的同步状态，设置 lastModified
          const newWateringRecordSyncStatus = {
            ...state.wateringRecordSyncStatus,
            [record.id]: {
              ...state.wateringRecordSyncStatus[record.id],
              lastModified: now,
              forceExpireUntil: now + 60 * 1000, // 60秒强制过期
              isComplete: false // 新记录需要同步
            }
          }
          
          // 更新关联植物的同步状态，设置 lastModified
          const newPlantSyncStatus = {
            ...state.plantSyncStatus,
            [record.plantId]: {
              ...state.plantSyncStatus[record.plantId],
              lastModified: now,
              forceExpireUntil: now + 60 * 1000, // 60秒强制过期
              isComplete: false // 植物状态可能需要更新
            }
          }
          
          return {
            wateringRecords: [...state.wateringRecords, record],
            wateringRecordSyncStatus: newWateringRecordSyncStatus,
            plantSyncStatus: newPlantSyncStatus
          }
        }),

        updateWateringRecord: (id: string, updates: Partial<WateringRecord>) => set((state) => ({
          wateringRecords: state.wateringRecords.map(record =>
            record.id === id ? { ...record, ...updates } : record
          )
        })),


        // Actions - 网络状态
        setOnlineStatus: (status: boolean) => set({ isOnline: status }),

        // Actions - 通知相关
        addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'createdAt'>) => {
          // 同时发送 PWA 本地通知
          pwaService.sendLocalNotification(notification.title, {
            body: notification.message,
            tag: `app-notification-${Date.now()}`,
            icon: '/pwa-192x192.png'
          }).catch(error => {
            console.warn('发送PWA通知失败:', error)
          })

          // 更新应用内通知状态
          set((state) => ({
            notifications: [
              {
                ...notification,
                id: crypto.randomUUID(),
                createdAt: new Date()
              },
              ...state.notifications
            ]
          }))
        },
        
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
        }),

        // Actions - 收藏植物相关
        addFavoritePlant: (plant: Plant) => set((state) => {
          // 检查是否已收藏
          if (state.favoritePlants.some(p => p.id === plant.id)) {
            return state
          }
          // 创建植物快照并添加到收藏
          return {
            favoritePlants: [...state.favoritePlants, { ...plant }]
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
          // 检查是否已收藏
          if (state.favoriteWateringRecords.some(r => r.id === record.id)) {
            return state
          }
          // 创建浇水记录快照并添加到收藏
          return {
            favoriteWateringRecords: [...state.favoriteWateringRecords, { ...record }]
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

        // Actions - 开花抽取功能相关
        checkCanDrawMemory: (): boolean => {
          const state = get()
          const { currentPlantId, plants, wateringRecords, dailyBloomDraws } = state
          
          console.log('🔍 checkCanDrawMemory Debug:')
          console.log('- currentPlantId:', currentPlantId)
          console.log('- plants:', plants)
          console.log('- wateringRecords:', wateringRecords)
          console.log('- dailyBloomDraws:', dailyBloomDraws)
          
          // 检查当前植物是否存在且处于开花状态
          const currentPlant = currentPlantId ? plants.find(p => p.id === currentPlantId) : null
          console.log('- currentPlant:', currentPlant)
          console.log('- plant growth stage:', currentPlant?.currentGrowthStage)
          
          if (!currentPlant || currentPlant.currentGrowthStage !== 'flowering') {
            console.log('- checkCanDrawMemory: false (no plant or not flowering)')
            return false
          }
          
          // 检查今日是否已浇水
          const today = new Date().toDateString()
          console.log('- today:', today)
          
          const todayWateringRecords = wateringRecords.filter(record => {
            const recordDate = new Date(record.wateringTime).toDateString()
            const isMatch = record.plantId === currentPlantId && recordDate === today
            console.log(`  - checking record ${record.id}: plantId=${record.plantId}, date=${recordDate}, isMatch=${isMatch}`)
            return isMatch
          })
          
          console.log('- todayWateringRecords:', todayWateringRecords)
          
          if (todayWateringRecords.length === 0) {
            console.log('- checkCanDrawMemory: false (no watering today)')
            return false
          }
          
          // 检查今日抽取次数是否小于3
          const todayDrawCount = dailyBloomDraws[today] || 0
          console.log('- todayDrawCount:', todayDrawCount)
          
          const canDraw = todayDrawCount < 3
          console.log('- checkCanDrawMemory result:', canDraw)
          return canDraw
        },

        getTodayDrawCount: (): number => {
          const state = get()
          const today = new Date().toDateString()
          const count = state.dailyBloomDraws[today] || 0
          console.log('📊 getTodayDrawCount Debug:')
          console.log('- today:', today)
          console.log('- dailyBloomDraws:', state.dailyBloomDraws)
          console.log('- count for today:', count)
          return count
        },

        performMemoryDraw: (): WateringRecord | null => {
          const state = get()
          const { currentPlantId, wateringRecords, dailyBloomDraws } = state
          
          console.log('🎯 performMemoryDraw Debug:')
          console.log('- currentPlantId:', currentPlantId)
          console.log('- wateringRecords count:', wateringRecords.length)
          console.log('- all wateringRecords:', wateringRecords)
          
          if (!currentPlantId) {
            console.log('- performMemoryDraw: null (no currentPlantId)')
            return null
          }
          
          // 获取历史浇水记录（排除今日记录）
          const today = new Date().toDateString()
          console.log('- today:', today)
          
          // 第一步：筛选当前植物的记录
          const plantRecords = wateringRecords.filter(record => record.plantId === currentPlantId)
          console.log('- plantRecords:', plantRecords.length, plantRecords)
          
          // 第二步：排除今日记录
          const nonTodayRecords = plantRecords.filter(record => {
            const recordDate = new Date(record.wateringTime).toDateString()
            const isNotToday = recordDate !== today
            console.log(`  - record ${record.id}: date=${recordDate}, isNotToday=${isNotToday}`)
            return isNotToday
          })
          console.log('- nonTodayRecords:', nonTodayRecords.length, nonTodayRecords)
          
          // 第三步：确保有记忆内容和情感标签
          const historicalRecords = nonTodayRecords.filter(record => {
            const hasMemoryText = !!record.memoryText
            const hasEmotionTags = !!(record.emotionTags && record.emotionTags.length > 0)
            console.log(`  - record ${record.id}: hasMemoryText=${hasMemoryText}, hasEmotionTags=${hasEmotionTags}`)
            console.log(`    - memoryText:`, record.memoryText)
            console.log(`    - emotionTags:`, record.emotionTags)
            return hasMemoryText && hasEmotionTags
          })
          
          console.log('- historicalRecords:', historicalRecords.length, historicalRecords)
          
          if (historicalRecords.length === 0) {
            console.log('- performMemoryDraw: null (no historical records)')
            return null
          }
          
          // 按情感强度加权随机选择
          const weightedRecords = historicalRecords.map(record => {
            const weight = (record.emotionIntensity || 1) * Math.random()
            console.log(`  - record ${record.id}: emotionIntensity=${record.emotionIntensity}, weight=${weight}`)
            return {
              record,
              weight
            }
          })
          
          console.log('- weightedRecords:', weightedRecords)
          
          // 选择权重最高的记录
          const selectedRecord = weightedRecords.reduce((prev, current) => 
            current.weight > prev.weight ? current : prev
          ).record
          
          console.log('- selectedRecord:', selectedRecord)
          
          // 更新抽取次数
          const newDrawCount = (dailyBloomDraws[today] || 0) + 1
          console.log('- updating draw count from', dailyBloomDraws[today] || 0, 'to', newDrawCount)
          
          set((state) => ({
            dailyBloomDraws: {
              ...state.dailyBloomDraws,
              [today]: newDrawCount
            },
            lastDrawDate: today
          }))
          
          console.log('- performMemoryDraw result:', selectedRecord)
          return selectedRecord
        },

        resetDailyDrawStatus: () => {
          const today = new Date().toDateString()
          set((state) => {
            // 清理过期的抽取记录（保留最近7天）
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            
            const cleanedDraws = Object.fromEntries(
              Object.entries(state.dailyBloomDraws).filter(([date]) => 
                new Date(date) >= sevenDaysAgo
              )
            )
            
            return {
              dailyBloomDraws: cleanedDraws,
              lastDrawDate: today
            }
          })
        },

        // Actions - 同步状态相关
        setSyncStatus: (entityId: string, type: 'plant' | 'watering', status: Partial<SyncStatus>) => set((state) => {
          const statusKey = type === 'plant' ? 'plantSyncStatus' : 'wateringRecordSyncStatus'
          const currentStatus = state[statusKey][entityId] || { lastSync: 0, isComplete: false, isSyncing: false }
          
          return {
            [statusKey]: {
              ...state[statusKey],
              [entityId]: { ...currentStatus, ...status }
            }
          } as Partial<AppState>
        }),

        getSyncStatus: (entityId: string, type: 'plant' | 'watering'): SyncStatus => {
          const state = get()
          const statusKey = type === 'plant' ? 'plantSyncStatus' : 'wateringRecordSyncStatus'
          return state[statusKey][entityId] || { lastSync: 0, isComplete: false, isSyncing: false }
        },

        setLastGlobalSync: (timestamp: number) => set({ lastGlobalSync: timestamp }),

        // Actions - 智能同步相关
        syncPlant: async (plantId: string): Promise<Plant | null> => {
          const state = get()
          const { setSyncStatus, updatePlant } = state
          
          try {
            setSyncStatus(plantId, 'plant', { isSyncing: true, error: undefined })
            
            // 从后端获取最新植物数据
            const response = await apiService.plants.getById(plantId)
            const updatedPlant = {
              ...response.data,
              lastSyncTime: Date.now(),
              syncStatus: 'complete' as const
            }
            
            // 更新本地植物数据
            updatePlant(plantId, updatedPlant)
            
            setSyncStatus(plantId, 'plant', { 
              isSyncing: false, 
              isComplete: true, 
              lastSync: Date.now() 
            })
            
            return updatedPlant
          } catch (error) {
            console.error(`同步植物 ${plantId} 失败:`, error)
            setSyncStatus(plantId, 'plant', { 
              isSyncing: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
            return null
          }
        },

        syncWateringRecord: async (recordId: string): Promise<WateringRecord | null> => {
          const state = get()
          const { setSyncStatus, updateWateringRecord } = state
          
          try {
            setSyncStatus(recordId, 'watering', { isSyncing: true, error: undefined })
            
            // 从后端获取最新浇水记录数据
            const response = await apiService.watering.getRecordById(recordId)
            const updatedRecord = response.data
            
            // 更新本地浇水记录数据
            updateWateringRecord(recordId, updatedRecord)
            
            setSyncStatus(recordId, 'watering', { 
              isSyncing: false, 
              isComplete: true, 
              lastSync: Date.now() 
            })
            
            return updatedRecord
          } catch (error) {
            console.error(`同步浇水记录 ${recordId} 失败:`, error)
            setSyncStatus(recordId, 'watering', { 
              isSyncing: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
            return null
          }
        },

        syncIncompleteRecords: async (): Promise<void> => {
          const state = get()
          const { plants, wateringRecords, syncPlant, syncWateringRecord } = state
          
          // 同步不完整的植物记录
          const incompletePlants = plants.filter((plant: Plant) => 
            plant.syncStatus !== 'complete' || !plant.lastSyncTime
          )
          
          // 同步不完整的浇水记录  
          const incompleteWateringRecords = wateringRecords.filter((record: WateringRecord) => 
            !record.memoryText || !record.emotionTags
          )
          
          // 批量同步
          await Promise.all([
            ...incompletePlants.map((plant: Plant) => syncPlant(plant.id)),
            ...incompleteWateringRecords.map((record: WateringRecord) => syncWateringRecord(record.id))
          ])
        }
      }),
      {
        name: 'memobloom-storage',
        partialize: (state) => ({
          plants: state.plants,
          currentPlantId: state.currentPlantId,
          wateringRecords: state.wateringRecords,
          notifications: state.notifications,
          // 收藏功能数据
          favoritePlants: state.favoritePlants,
          favoriteWateringRecords: state.favoriteWateringRecords,
          // 过滤掉 isSyncing 状态，防止持久化卡住的同步状态
          plantSyncStatus: Object.fromEntries(
            Object.entries(state.plantSyncStatus).map(([id, status]) => [
              id, 
              { ...status, isSyncing: false }  // 强制设为 false
            ])
          ),
          wateringRecordSyncStatus: Object.fromEntries(
            Object.entries(state.wateringRecordSyncStatus).map(([id, status]) => [
              id,
              { ...status, isSyncing: false }  // 强制设为 false
            ])
          ),
          lastGlobalSync: state.lastGlobalSync,
          // 开花抽取功能数据
          dailyBloomDraws: state.dailyBloomDraws,
          lastDrawDate: state.lastDrawDate
        })
      }
    )
  )
)
