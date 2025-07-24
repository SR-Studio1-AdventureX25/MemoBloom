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

// 数据验证辅助函数
const validateApiResponse = (data: unknown, expectedType: 'array' | 'object') => {
  if (expectedType === 'array' && !Array.isArray(data)) {
    throw new Error('API_DATA_FORMAT_ERROR: 期望数组格式')
  }
  
  if (expectedType === 'object' && (typeof data !== 'object' || data === null)) {
    throw new Error('API_DATA_FORMAT_ERROR: 期望对象格式')
  }
  
  // 检查是否意外接收到HTML字符串
  if (typeof data === 'string' && (data.includes('<html>') || data.includes('<!doctype html>'))) {
    throw new Error('API_DATA_FORMAT_ERROR: 数据中包含HTML内容')
  }
}

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 检查响应内容类型
    const contentType = response.headers['content-type'] || ''
    
    // 如果期望JSON但返回HTML，抛出错误
    if (contentType.includes('text/html')) {
      console.error('API返回了HTML页面:', response.config.url)
      console.error('响应内容:', String(response.data).substring(0, 200) + '...')
      
      const { addNotification } = getNotificationActions()
      addNotification({
        title: 'API配置错误',
        message: '服务器返回了网页而不是数据，请检查API配置',
        type: 'error',
        read: false
      })
      
      throw new Error('API_CONTENT_TYPE_ERROR: 期望JSON但收到HTML')
    }
    
    // 检查响应数据是否为字符串形式的HTML
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype html>')) {
      console.error('检测到HTML字符串响应:', response.config.url)
      console.error('HTML内容:', response.data.substring(0, 200) + '...')
      
      const { addNotification } = getNotificationActions()
      addNotification({
        title: 'API响应格式错误',
        message: '接收到HTML页面而不是预期的数据格式',
        type: 'error',
        read: false
      })
      
      throw new Error('API_HTML_RESPONSE: 检测到HTML字符串响应')
    }
    
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

  // 植物相关
  plants: {
    // 获取所有植物
    getAll: async (): Promise<{ data: Plant[] }> => {
      const response = await api.get('/plants')
      validateApiResponse(response.data, 'array')
      return response
    },
    
    // 根据ID获取植物
    getById: async (id: string): Promise<{ data: Plant }> => {
      const response = await api.get(`/plants/${id}`)
      validateApiResponse(response.data, 'object')
      return response
    },
    
    // 创建植物
    create: async (plantData: CreatePlantRequest): Promise<{ data: CreatePlantResponse }> => {
      const response = await api.post('/plants', plantData)
      validateApiResponse(response.data, 'object')
      return response
    },
    
    // 更新植物信息
    update: async (id: string, updates: Partial<Plant>): Promise<{ data: Plant }> => {
      const response = await api.patch(`/plants/${id}`, updates)
      validateApiResponse(response.data, 'object')
      return response
    },
    
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
