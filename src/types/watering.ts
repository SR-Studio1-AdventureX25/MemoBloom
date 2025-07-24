// 浇水记录类型
export interface WateringRecord {
  id: string                      // 浇水记录ID（字符串）
  plantId: string                 // 关联植物ID
  plantGrowthValue: number        // 植物成长值
  memoryFile?: string             // 记忆附件（token）
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
