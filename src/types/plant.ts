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
