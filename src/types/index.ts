// 植物数据类型
export interface Plant {
  id: string                      // 植物ID（字符串）
  variety: string                 // 植物品种
  currentGrowthStage: string      // 当前生长阶段
  growthValue: number             // 成长值
  lastWateringTime: string        // 上次浇水时间
  userRecentStatus: string        // 用户近期状况（字符串）
  personalityTags: string[]       // 植物个性标签（字符串数组）
  nftMinted: boolean              // NFT铸造状态（布尔）
  nftAddress?: string             // NFT地址
  nftWalletAddress?: string       // NFT所属钱包地址
  createdAt: string               // 创建时间
}

// 浇水记录类型
export interface WateringRecord {
  id: string                      // 浇水记录ID（字符串）
  plantId: string                 // 关联植物ID
  plantGrowthValue: number        // 植物成长值
  memoryText?: string             // 记忆文本（字符串）
  emotionTags?: string[]          // 情绪标签（字符串数组）
  emotionIntensity?: number       // 情绪强度
  growthIncrement?: number        // 生长值增量
  coreEvent?: string              // 核心事件（字符串）
  nftMinted: boolean              // NFT铸造状态
  nftAddress?: string             // NFT地址
  nftWalletAddress?: string       // NFT所属钱包地址
  wateringTime: string            // 浇水时间
  nftMintTime?: string            // NFT铸造时间
}

// 创建植物请求类型
export interface CreatePlantRequest {
  variety: string                 // 植物品种
}

// 创建植物响应类型
export interface CreatePlantResponse {
  plant: Plant
}

// 浇水请求类型
export interface WaterPlantRequest {
  plantId: string                 // 植物ID
  plantGrowthValue: number        // 植物成长值（使用当前成长值）
  audioFile: Blob                 // 音频文件
  wateringTime: string            // 浇水时间
}

// 浇水响应类型
export interface WaterPlantResponse {
  recordId: string                // 浇水记录ID
  wateringTime: string            // 浇水时间
}

// 离线浇水队列项类型
export interface OfflineWateringItem {
  id: string                      // 本地ID
  plantId: string                 // 植物ID
  plantGrowthValue: number        // 植物成长值
  audioBlob: Blob                 // 音频文件
  wateringTime: string            // 浇水时间
  retryCount: number              // 重试次数
  createdAt: Date                 // 创建时间
}

// 资源缓存状态类型
export interface ResourceCacheStatus {
  isLoaded: boolean               // 是否已加载
  progress: number                // 加载进度 (0-100)
  error?: string                  // 错误信息
}

// 应用状态类型
export interface AppState {
  user: {
    id: string
    name: string
    level: number
    experience: number
  } | null
  plants: Plant[]                 // 植物列表
  currentPlant: Plant | null      // 当前植物
  wateringRecords: WateringRecord[] // 浇水记录
  offlineWateringQueue: OfflineWateringItem[] // 离线浇水队列
  isOnline: boolean               // 在线状态
  resourceCache: ResourceCacheStatus // 资源缓存状态
  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    read: boolean
    createdAt: Date
  }>
}

// 植物品种常量
export const PlantVariety = {
  SUNFLOWER: 'sunflower',         // 向日葵
  ROSE: 'rose',                   // 玫瑰
  LAVENDER: 'lavender',           // 薰衣草
  BAMBOO: 'bamboo',               // 竹子
  SAKURA: 'sakura',               // 樱花
} as const

export type PlantVarietyType = typeof PlantVariety[keyof typeof PlantVariety]

// 植物生长阶段常量
export const PlantGrowthStage = {
  SEED: 'seed',                   // 种子
  SPROUT: 'sprout',               // 发芽
  YOUNG: 'young',                 // 幼苗
  MATURE: 'mature',               // 成熟
  FLOWERING: 'flowering',         // 开花
  FRUITING: 'fruiting',           // 结果
} as const

export type PlantGrowthStageType = typeof PlantGrowthStage[keyof typeof PlantGrowthStage]

// API错误类型
export interface APIError {
  code: string
  message: string
  details?: unknown
}
