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

// 请求拦截器 - 自动添加app_id
api.interceptors.request.use(
  (config) => {
    // 自动添加app_id到请求头
    config.headers['app_id'] = 'cli_a80b12114178101c'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)


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

// 后端响应类型定义
interface BackendPlantResponse {
  message: string
  record_id: string
  access_token: string
  detail?: {
    [key: string]: unknown
    '植物品种'?: string
    '当前生长阶段'?: string
    '成长值'?: number[]
    '上次浇水时间'?: string
    '用户近期状况'?: string
    '植物个性标签'?: string[]
    'NFT铸造状态'?: boolean
    'NFT地址'?: string
    'NFT所属钱包地址'?: string
    '创建时间'?: string
  }
}

interface BackendWaterResponse {
  message: string
  record_id: string
  access_token: string
  detail?: {
    [key: string]: unknown
    '关联植物ID'?: string[]
    '植物成长值'?: number
    '记忆内容'?: Array<{ file_token: string }>
    '记忆文本'?: Array<{ text: string }>
    '情绪标签'?: string[]
    '情绪强度'?: number
    '生长值增量'?: number
    '核心事件'?: Array<{ text: string }>
    'NFT铸造状态'?: boolean
    'NFT地址'?: string
    'NFT所属用户地址'?: string
    '浇水时间'?: string
    'NFT铸造时间'?: string
  }
}

interface BackendAudioResponse {
  message: string
  url: string
  access_token: string
}

// 枚举值映射
const mapChineseToEnglishGrowthStage = (chineseStage: string): string => {
  const stageMap: Record<string, string> = {
    '种子': 'seed',
    '发芽': 'sprout',
    '含苞': 'mature',
    '开花': 'flowering',
    '结果': 'fruiting'
  }
  return stageMap[chineseStage] || 'seed'
}

// const mapEnglishToChineseGrowthStage = (englishStage: string): string => {
//   const stageMap: Record<string, string> = {
//     'seed': '种子',
//     'sprout': '发芽',
//     'mature': '含苞',
//     'flowering': '开花',
//     'fruiting': '结果'
//   }
//   return stageMap[englishStage] || '种子'
// }

const mapChineseToEnglishVariety = (chineseVariety: string): string => {
  const varietyMap: Record<string, string> = {
    '多肉植物': 'duorou',
    '向日葵': 'sunflower'
  }
  return varietyMap[chineseVariety] || chineseVariety
}

const mapEnglishToChineseVariety = (englishVariety: string): string => {
  const varietyMap: Record<string, string> = {
    'duorou': '多肉植物',
    'sunflower': '向日葵'
  }
  return varietyMap[englishVariety] || englishVariety
}

// 数据映射函数
const mapBackendPlantToFrontend = (backendData: BackendPlantResponse): Plant => {
  const detail = backendData.detail || {}
  return {
    id: backendData.record_id,
    variety: mapChineseToEnglishVariety(detail['植物品种'] || ''),
    currentGrowthStage: mapChineseToEnglishGrowthStage(detail['当前生长阶段'] || ''),
    growthValue: detail['成长值']?.[0] || 0,
    lastWateringTime: detail['上次浇水时间'] || '',
    userRecentStatus: detail['用户近期状况'] || '',
    personalityTags: detail['植物个性标签'] || [],
    nftMinted: detail['NFT铸造状态'] || false,
    nftAddress: detail['NFT地址'],
    nftWalletAddress: detail['NFT所属钱包地址'],
    createdAt: detail['创建时间'] || new Date().toISOString()
  }
}

const mapBackendWaterToFrontend = (backendData: BackendWaterResponse): WateringRecord => {
  const detail = backendData.detail || {}
  return {
    id: backendData.record_id,
    plantId: detail['关联植物ID']?.[0] || '',
    plantGrowthValue: detail['植物成长值'] || 0,
    memoryFile: detail['记忆内容']?.[0]?.file_token,
    memoryText: detail['记忆文本']?.[0]?.text,
    emotionTags: detail['情绪标签'],
    emotionIntensity: detail['情绪强度'],
    growthIncrement: detail['生长值增量'],
    coreEvent: detail['核心事件']?.[0]?.text,
    nftMinted: detail['NFT铸造状态'] || false,
    nftAddress: detail['NFT地址'],
    nftWalletAddress: detail['NFT所属用户地址'],
    wateringTime: detail['浇水时间'] || new Date().toISOString(),
    nftMintTime: detail['NFT铸造时间']
  }
}

// API方法
export const apiService = {

  // 植物相关
  plants: {
    // 根据ID获取植物
    getById: async (id: string): Promise<{ data: Plant }> => {
      const response = await api.get<BackendPlantResponse>(`/get_plant/${id}`)
      
      if (response.data.message !== 'OK') {
        throw new Error(`获取植物失败: ${response.data.message}`)
      }
      
      const plant = mapBackendPlantToFrontend(response.data)
      return { data: plant }
    },
    
    // 创建植物
    create: async (plantData: CreatePlantRequest): Promise<{ data: CreatePlantResponse }> => {
      const response = await api.post<BackendPlantResponse>('/add_plant', {
        plant_name: mapEnglishToChineseVariety(plantData.variety)
      })
      
      if (response.data.message !== 'OK') {
        throw new Error(`创建植物失败: ${response.data.message}`)
      }
      
      // 创建后需要再获取详细信息
      const plantResponse = await apiService.plants.getById(response.data.record_id)
      return { 
        data: { 
          plant: plantResponse.data 
        } 
      }
    },
    
  },

  // 浇水相关
  watering: {
    // 浇水（提交录音）
    water: async (data: WaterPlantRequest): Promise<{ data: WaterPlantResponse }> => {
      const formData = new FormData()
      formData.append('file', data.audioFile)
      console.log(data.plantGrowthValue);
      formData.append('growth_value', `${data.plantGrowthValue}`)
      formData.append('record_id', data.plantId)
      
      const response = await api.post<BackendPlantResponse>('/water_plant', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data.message !== 'OK') {
        throw new Error(`浇水失败: ${response.data.message}`)
      }
      
      return {
        data: {
          recordId: response.data.record_id,
          wateringTime: data.wateringTime
        }
      }
    },

    // 根据ID获取浇水记录详情
    getRecordById: async (id: string): Promise<{ data: WateringRecord }> => {
      const response = await api.get<BackendWaterResponse>(`/get_water/${id}`)
      
      if (response.data.message !== 'OK') {
        throw new Error(`获取浇水记录失败: ${response.data.message}`)
      }
      
      const waterRecord = mapBackendWaterToFrontend(response.data)
      return { data: waterRecord }
    },

    // 获取浇水记录（保留原有接口）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getRecords: async (_plantId?: string): Promise<{ data: WateringRecord[] }> => {
      // 后端没有批量获取浇水记录的接口，返回空数组
      return { data: [] }
    },

    // 批量获取浇水记录（保留原有接口）
    getRecordsByIds: async (ids: string[]): Promise<{ data: WateringRecord[] }> => {
      // 可以循环调用getRecordById来实现
      const records: WateringRecord[] = []
      for (const id of ids) {
        try {
          const response = await apiService.watering.getRecordById(id)
          records.push(response.data)
        } catch (error) {
          console.warn(`获取浇水记录 ${id} 失败:`, error)
        }
      }
      return { data: records }
    },
  },

  // 音频相关
  audio: {
    // 获取音频URL
    getUrl: async (fileToken: string): Promise<{ data: { url: string } }> => {
      const response = await api.get<BackendAudioResponse>(`/get_audio/${fileToken}`)
      
      if (response.data.message !== 'OK') {
        throw new Error(`获取音频失败: ${response.data.message}`)
      }
      
      return {
        data: {
          url: response.data.url
        }
      }
    }
  },

  // 同步相关（保留原有接口）
  sync: {
    // 上传离线数据
    uploadOfflineData: async (data: WaterPlantRequest[]): Promise<{ data: { success: boolean; results: WaterPlantResponse[] } }> => {
      const results: WaterPlantResponse[] = []
      
      for (const item of data) {
        try {
          const response = await apiService.watering.water(item)
          results.push(response.data)
        } catch (error) {
          console.warn('上传离线数据失败:', error)
        }
      }
      
      return {
        data: {
          success: results.length > 0,
          results
        }
      }
    }
  }
}

export default api
