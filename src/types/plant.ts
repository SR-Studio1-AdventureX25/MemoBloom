// 植物数据类型
export interface Plant {
  id: string                      // 植物ID（字符串）
  variety: string                 // 植物品种
  currentGrowthStage: string      // 当前生长阶段
  growthValue: number             // 成长值
  lastWateringTime: number        // 上次浇水时间
  userRecentStatus: string        // 用户近期状况（字符串）
  personalityTags: string[]       // 植物个性标签（字符串数组）
  nftMinted: boolean              // NFT铸造状态（布尔）
  nftAddress?: string             // NFT地址
  nftWalletAddress?: string       // NFT所属钱包地址
  createdAt: string               // 创建时间
  // 同步相关字段
  lastSyncTime?: number           // 最后同步时间戳
  syncStatus?: 'complete' | 'partial' | 'pending'  // 同步状态
  isLocalOnly?: boolean           // 是否仅存在于本地（离线创建）
}

// 植物品种常量
export const PlantVariety = {
  DUOROU: '多肉植物',         // 多肉植物
} as const

export type PlantVarietyType = typeof PlantVariety[keyof typeof PlantVariety]

// 植物生长阶段常量
export const PlantGrowthStage = {
  SEED: 'seed',                   // 种子
  SPROUT: 'sprout',               // 发芽
  MATURE: 'mature',               // 含苞
  FLOWERING: 'flowering',         // 开花
  FRUITING: 'fruiting',           // 结束
} as const

export type PlantGrowthStageType = typeof PlantGrowthStage[keyof typeof PlantGrowthStage]
