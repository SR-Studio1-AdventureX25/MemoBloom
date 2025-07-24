import axios from 'axios'
import { useAppStore } from '@/store'

// 获取通知相关的 actions
const getNotificationActions = () => {
  const store = useAppStore.getState()
  return {
    addNotification: store.addNotification
  }
}

// 获取在线状态相关的 actions
const getOnlineActions = () => {
  const store = useAppStore.getState()
  return {
    setOnlineStatus: store.setOnlineStatus
  }
}

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { addNotification } = getNotificationActions()
    
    if (error.response?.status >= 500) {
      // 处理服务器错误
      addNotification({
        title: '服务器错误',
        message: '请稍后重试',
        type: 'error',
        read: false
      })
    } else if (!error.response) {
      // 处理网络错误
      const { setOnlineStatus } = getOnlineActions()
      setOnlineStatus(false)
      addNotification({
        title: '网络连接中断',
        message: '已切换到离线模式',
        type: 'warning',
        read: false
      })
    }
    
    return Promise.reject(error)
  }
)

import type {
  Plant,
  WateringRecord,
  CreatePlantRequest,
  CreatePlantResponse,
  WaterPlantRequest,
  WaterPlantResponse
} from '@/types'

// API方法
export const apiService = {
  // 用户相关
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post('/auth/login', credentials),
    register: (userData: { email: string; password: string; name: string }) =>
      api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refreshToken: () => api.post('/auth/refresh'),
  },

  // 植物相关
  plants: {
    // 获取所有植物
    getAll: (): Promise<{ data: Plant[] }> => api.get('/plants'),
    
    // 根据ID获取植物
    getById: (id: string): Promise<{ data: Plant }> => api.get(`/plants/${id}`),
    
    // 创建植物
    create: (plantData: CreatePlantRequest): Promise<{ data: CreatePlantResponse }> => 
      api.post('/plants', plantData),
    
    // 更新植物信息
    update: (id: string, updates: Partial<Plant>): Promise<{ data: Plant }> => 
      api.patch(`/plants/${id}`, updates),
    
    // 删除植物
    delete: (id: string): Promise<{ data: { success: boolean } }> => 
      api.delete(`/plants/${id}`),
  },

  // 浇水相关
  watering: {
    // 浇水（提交录音）
    water: (data: WaterPlantRequest): Promise<{ data: WaterPlantResponse }> => {
      const formData = new FormData()
      formData.append('plantId', data.plantId)
      formData.append('plantGrowthValue', data.plantGrowthValue.toString())
      formData.append('wateringTime', data.wateringTime)
      formData.append('audio', data.audioFile)
      
      return api.post('/watering', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },

    // 获取浇水记录
    getRecords: (plantId?: string): Promise<{ data: WateringRecord[] }> => {
      const url = plantId ? `/watering?plantId=${plantId}` : '/watering'
      return api.get(url)
    },

    // 根据ID获取浇水记录详情
    getRecordById: (id: string): Promise<{ data: WateringRecord }> => 
      api.get(`/watering/${id}`),

    // 批量获取浇水记录（用于拉取缺失数据）
    getRecordsByIds: (ids: string[]): Promise<{ data: WateringRecord[] }> => 
      api.post('/watering/batch', { ids }),
  },

  // 同步相关
  sync: {
    // 上传离线数据
    uploadOfflineData: (data: WaterPlantRequest[]): Promise<{ data: { success: boolean; results: WaterPlantResponse[] } }> => {
      const formData = new FormData()
      
      data.forEach((item, index) => {
        formData.append(`data[${index}][plantId]`, item.plantId)
        formData.append(`data[${index}][plantGrowthValue]`, item.plantGrowthValue.toString())
        formData.append(`data[${index}][wateringTime]`, item.wateringTime)
        formData.append(`data[${index}][audio]`, item.audioFile)
      })
      
      return api.post('/sync/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },

    // 获取最后同步时间
    getLastSync: (): Promise<{ data: { lastSyncTime: string } }> => 
      api.get('/sync/last'),

    // 获取增量数据（自上次同步后的数据）
    getIncrementalData: (lastSyncTime: string): Promise<{ data: { plants: Plant[]; wateringRecords: WateringRecord[] } }> => 
      api.get(`/sync/incremental?since=${encodeURIComponent(lastSyncTime)}`),
  }
}

export default api
