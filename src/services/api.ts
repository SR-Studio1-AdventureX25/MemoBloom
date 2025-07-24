import axios from 'axios'
import { useAppStore } from '@/store'

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { addNotification } = useAppStore.getState()
    
    if (error.response?.status === 401) {
      // 处理未授权错误
      localStorage.removeItem('auth_token')
      addNotification({
        title: '认证失败',
        message: '请重新登录',
        type: 'error',
        read: false
      })
    } else if (error.response?.status >= 500) {
      // 处理服务器错误
      addNotification({
        title: '服务器错误',
        message: '请稍后重试',
        type: 'error',
        read: false
      })
    } else if (!error.response) {
      // 处理网络错误
      useAppStore.getState().setOnlineStatus(false)
      addNotification({
        title: '网络错误',
        message: '请检查网络连接',
        type: 'warning',
        read: false
      })
    }
    
    return Promise.reject(error)
  }
)

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
    getAll: () => api.get('/plants'),
    getById: (id: string) => api.get(`/plants/${id}`),
    create: (plantData: any) => api.post('/plants', plantData),
    update: (id: string, updates: any) => api.patch(`/plants/${id}`, updates),
    delete: (id: string) => api.delete(`/plants/${id}`),
    water: (id: string) => api.post(`/plants/${id}/water`),
    fertilize: (id: string) => api.post(`/plants/${id}/fertilize`),
  },

  // 用户进度
  progress: {
    getStats: () => api.get('/progress/stats'),
    getAchievements: () => api.get('/progress/achievements'),
  },

  // 同步相关
  sync: {
    uploadData: (data: any) => api.post('/sync/upload', data),
    downloadData: () => api.get('/sync/download'),
    getLastSync: () => api.get('/sync/last'),
  }
}

export default api
