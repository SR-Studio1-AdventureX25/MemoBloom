import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AppState {
  user: {
    id: string
    name: string
    level: number
    experience: number
  } | null
  plants: Array<{
    id: string
    name: string
    type: string
    level: number
    health: number
    happiness: number
    waterLevel: number
    lastWatered: Date
    lastFertilized: Date
  }>
  isOnline: boolean
  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    read: boolean
    createdAt: Date
  }>
}

interface AppActions {
  setUser: (user: AppState['user']) => void
  addPlant: (plant: AppState['plants'][0]) => void
  updatePlant: (id: string, updates: Partial<AppState['plants'][0]>) => void
  removePlant: (id: string) => void
  setOnlineStatus: (status: boolean) => void
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'createdAt'>) => void
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        plants: [],
        isOnline: true,
        notifications: [],

        // Actions
        setUser: (user) => set({ user }),
        
        addPlant: (plant) => set((state) => ({
          plants: [...state.plants, plant]
        })),
        
        updatePlant: (id, updates) => set((state) => ({
          plants: state.plants.map(plant => 
            plant.id === id ? { ...plant, ...updates } : plant
          )
        })),
        
        removePlant: (id) => set((state) => ({
          plants: state.plants.filter(plant => plant.id !== id)
        })),
        
        setOnlineStatus: (status) => set({ isOnline: status }),
        
        addNotification: (notification) => set((state) => ({
          notifications: [
            {
              ...notification,
              id: crypto.randomUUID(),
              createdAt: new Date()
            },
            ...state.notifications
          ]
        })),
        
        markNotificationAsRead: (id) => set((state) => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        })),
        
        clearNotifications: () => set({ notifications: [] })
      }),
      {
        name: 'memobloom-storage',
        partialize: (state) => ({
          user: state.user,
          plants: state.plants,
          notifications: state.notifications
        })
      }
    )
  )
)
