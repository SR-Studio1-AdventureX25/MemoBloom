import { IPFS_CONFIG } from '@/constants/contracts'

// IPFS 服务类 (模拟模式)
export class IPFSService {
  private gateway: string

  constructor() {
    this.gateway = IPFS_CONFIG.gateway
  }

  /**
   * 生成模拟的IPFS hash
   */
  private generateMockHash(data: unknown, type: string): string {
    // 基于数据内容和时间戳生成一个看起来真实的IPFS hash
    const content = JSON.stringify(data) + Date.now() + type
    const hash = this.simpleHash(content)
    // IPFS hash 通常以 Qm 开头，长度为46个字符
    return `Qm${hash.padEnd(44, '0').substring(0, 44)}`
  }

  /**
   * 简单的hash函数
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 上传JSON数据到IPFS (模拟)
   */
  async uploadJSON(data: Record<string, unknown>, name?: string): Promise<string> {
    try {
      console.log('🔄 模拟上传JSON到IPFS:', name || 'metadata.json')
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
      
      const mockHash = this.generateMockHash(data, 'json')
      
      console.log('✅ 模拟IPFS上传成功:', mockHash)
      return mockHash
    } catch (error) {
      console.error('IPFS JSON upload error:', error)
      throw new Error('Failed to upload metadata to IPFS')
    }
  }

  /**
   * 上传文件到IPFS (模拟)
   */
  async uploadFile(file: File): Promise<string> {
    try {
      console.log('🔄 模拟上传文件到IPFS:', file.name)
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
      
      const mockHash = this.generateMockHash({
        name: file.name,
        size: file.size,
        type: file.type
      }, 'file')
      
      console.log('✅ 模拟IPFS文件上传成功:', mockHash)
      return mockHash
    } catch (error) {
      console.error('IPFS file upload error:', error)
      throw new Error('Failed to upload file to IPFS')
    }
  }

  /**
   * 上传音频Blob到IPFS (模拟)
   */
  async uploadAudioBlob(audioBlob: Blob, filename: string): Promise<string> {
    try {
      console.log('🔄 模拟上传音频到IPFS:', filename)
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500))
      
      const mockHash = this.generateMockHash({
        filename,
        size: audioBlob.size,
        type: audioBlob.type
      }, 'audio')
      
      console.log('✅ 模拟IPFS音频上传成功:', mockHash)
      return mockHash
    } catch (error) {
      console.error('IPFS audio upload error:', error)
      throw new Error('Failed to upload audio to IPFS')
    }
  }

  /**
   * 获取IPFS文件的完整URL
   */
  getIPFSUrl(hash: string): string {
    return `${this.gateway}${hash}`
  }

  /**
   * 从IPFS获取JSON数据
   */
  async getJSON(hash: string): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(this.getIPFSUrl(hash))
      if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('IPFS JSON fetch error:', error)
      throw new Error('Failed to fetch data from IPFS')
    }
  }
}

// 创建单例实例
export const ipfsService = new IPFSService()

// 元数据生成工具
export class MetadataGenerator {
  /**
   * 生成植物完成NFT元数据
   */
  static async generatePlantMetadata(
    tokenId: number,
    plantData: {
      plantId: string
      variety: string
      finalGrowthValue: number
      personalityTags: string[]
      journeyDurationDays: number
      totalWaterings: number
      completionDate: number
      growthJourney: string
    },
    imageUrl?: string
  ): Promise<Record<string, unknown>> {
    const completionDateObj = new Date(plantData.completionDate * 1000)
    
    return {
      name: `MemoBloom Plant Completion #${tokenId}`,
      description: `A completed plant growth journey in MemoBloom - ${plantData.variety} that reached full maturity after ${plantData.journeyDurationDays} days of care.`,
      image: imageUrl || `https://memobloom.app/api/plant-image/${plantData.plantId}`,
      external_url: `https://memobloom.app/plant/${plantData.plantId}`,
      attributes: [
        {
          trait_type: "Plant ID",
          value: plantData.plantId
        },
        {
          trait_type: "Variety",
          value: plantData.variety
        },
        {
          trait_type: "Final Growth Value",
          value: plantData.finalGrowthValue,
          max_value: 100
        },
        {
          trait_type: "Journey Duration (Days)",
          value: plantData.journeyDurationDays,
          display_type: "number"
        },
        {
          trait_type: "Total Waterings",
          value: plantData.totalWaterings,
          display_type: "number"
        },
        {
          trait_type: "Completion Date",
          value: Math.floor(completionDateObj.getTime() / 1000),
          display_type: "date"
        },
        {
          trait_type: "Growth Journey Length",
          value: plantData.growthJourney.length,
          display_type: "number"
        },
        {
          trait_type: "NFT Type",
          value: "Plant Completion"
        },
        {
          trait_type: "Rarity",
          value: this.calculatePlantRarity(plantData)
        }
      ],
      personality_tags: plantData.personalityTags,
      growth_journey: plantData.growthJourney,
      plant_data: {
        plant_id: plantData.plantId,
        variety: plantData.variety,
        final_growth_value: plantData.finalGrowthValue,
        journey_duration_days: plantData.journeyDurationDays,
        total_waterings: plantData.totalWaterings,
        completion_timestamp: plantData.completionDate,
        personality_tags: plantData.personalityTags,
        growth_journey: plantData.growthJourney
      }
    }
  }

  /**
   * 生成记忆宝藏NFT元数据
   */
  static async generateMemoryMetadata(
    tokenId: number,
    memoryData: {
      recordId: string
      plantId: string
      memoryText: string
      emotionTags: string[]
      emotionIntensity: number
      growthIncrement: number
      coreEvent: string
      wateringDate: number
      audioFileHash?: string
      audioDuration?: number
      audioFormat?: string
    },
    imageUrl?: string
  ): Promise<Record<string, unknown>> {
    const wateringDateObj = new Date(memoryData.wateringDate * 1000)
    
    return {
      name: `MemoBloom Memory Treasure #${tokenId}`,
      description: `A treasured memory from your plant care journey - ${memoryData.coreEvent} that brought ${memoryData.emotionIntensity}/10 emotional intensity.`,
      image: imageUrl || `https://memobloom.app/api/memory-image/${memoryData.recordId}`,
      external_url: `https://memobloom.app/memory/${memoryData.recordId}`,
      attributes: [
        {
          trait_type: "Record ID",
          value: memoryData.recordId
        },
        {
          trait_type: "Plant ID",
          value: memoryData.plantId
        },
        {
          trait_type: "Core Event",
          value: memoryData.coreEvent
        },
        {
          trait_type: "Emotion Intensity",
          value: memoryData.emotionIntensity,
          max_value: 10,
          display_type: "number"
        },
        {
          trait_type: "Growth Increment",
          value: memoryData.growthIncrement,
          display_type: "number"
        },
        {
          trait_type: "Watering Date",
          value: Math.floor(wateringDateObj.getTime() / 1000),
          display_type: "date"
        },
        {
          trait_type: "Audio Duration",
          value: memoryData.audioDuration ? `${memoryData.audioDuration} seconds` : "No audio",
          display_type: memoryData.audioDuration ? "number" : "string"
        },
        {
          trait_type: "Audio Format",
          value: memoryData.audioFormat || "None"
        },
        {
          trait_type: "Has Audio",
          value: !!memoryData.audioFileHash
        },
        {
          trait_type: "NFT Type",
          value: "Memory Treasure"
        },
        {
          trait_type: "Rarity",
          value: this.calculateMemoryRarity(memoryData)
        }
      ],
      memory_text: memoryData.memoryText,
      emotion_tags: memoryData.emotionTags,
      audio: memoryData.audioFileHash ? ipfsService.getIPFSUrl(memoryData.audioFileHash) : null,
      memory_data: {
        record_id: memoryData.recordId,
        plant_id: memoryData.plantId,
        memory_text: memoryData.memoryText,
        emotion_tags: memoryData.emotionTags,
        emotion_intensity: memoryData.emotionIntensity,
        growth_increment: memoryData.growthIncrement,
        core_event: memoryData.coreEvent,
        watering_timestamp: memoryData.wateringDate,
        audio_file_hash: memoryData.audioFileHash || "",
        audio_duration: memoryData.audioDuration || 0,
        audio_format: memoryData.audioFormat || ""
      }
    }
  }

  /**
   * 计算植物NFT稀有度
   */
  private static calculatePlantRarity(plantData: {
    finalGrowthValue: number
    journeyDurationDays: number
    totalWaterings: number
  }): string {
    const { finalGrowthValue, journeyDurationDays } = plantData
    
    if (finalGrowthValue >= 95 && journeyDurationDays <= 7) {
      return "Legendary"
    } else if (finalGrowthValue >= 90 && journeyDurationDays <= 14) {
      return "Epic"
    } else if (finalGrowthValue >= 80 && journeyDurationDays <= 21) {
      return "Rare"
    } else if (finalGrowthValue >= 70) {
      return "Uncommon"
    } else {
      return "Common"
    }
  }

  /**
   * 计算记忆NFT稀有度
   */
  private static calculateMemoryRarity(memoryData: {
    emotionIntensity: number
    growthIncrement: number
    audioFileHash?: string
  }): string {
    const { emotionIntensity, growthIncrement, audioFileHash } = memoryData
    
    if (emotionIntensity >= 9 && growthIncrement >= 15 && audioFileHash) {
      return "Legendary"
    } else if (emotionIntensity >= 8 && growthIncrement >= 12) {
      return "Epic"
    } else if (emotionIntensity >= 7 && growthIncrement >= 10) {
      return "Rare"
    } else if (emotionIntensity >= 6) {
      return "Uncommon"
    } else {
      return "Common"
    }
  }
}
