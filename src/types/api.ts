import type { Plant } from './plant'

// 创建植物请求类型
export interface CreatePlantRequest {
  variety: string                 // 植物品种
}

// 创建植物响应类型
export interface CreatePlantResponse {
  plant: Plant
}

// API错误类型
export interface APIError {
  code: string
  message: string
  details?: unknown
}
