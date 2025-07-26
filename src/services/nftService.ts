import { ethers } from 'ethers'
import { CONTRACTS, INJECTIVE_TESTNET, CONTRACT_METHODS, GAS_LIMITS, NFTType, type NFTTypeValue } from '@/constants/contracts'
import { ipfsService, MetadataGenerator } from './ipfsService'
import type { Plant, WateringRecord } from '@/types'

// 导入ABI
import contractABI from '@/MemoBloomNFT.json'

// NFT服务类
export class NFTService {
  private provider: ethers.JsonRpcProvider
  private contract: any
  private contractAddress: string

  constructor() {
    this.contractAddress = CONTRACTS.MEMO_BLOOM_NFT.address
    this.provider = new ethers.JsonRpcProvider(INJECTIVE_TESTNET.rpcUrl)
    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI.abi,
      this.provider
    )
  }

  /**
   * 获取带签名者的合约实例
   */
  private async getContractWithSigner(privateKey: string): Promise<any> {
    const wallet = new ethers.Wallet(privateKey, this.provider)
    return this.contract.connect(wallet)
  }

  /**
   * 铸造植物完成NFT
   */
  async mintPlantCompletionNFT(
    privateKey: string,
    plant: Plant,
    wateringRecords: WateringRecord[]
  ): Promise<{
    tokenId: number
    transactionHash: string
    metadataHash: string
  }> {
    try {
      // 检查植物是否已经铸造过NFT
      const isEligible = await this.contract[CONTRACT_METHODS.IS_PLANT_ELIGIBLE_FOR_NFT](plant.id)
      if (!isEligible) {
        throw new Error('Plant NFT already exists')
      }

      // 准备植物数据
      const wallet = new ethers.Wallet(privateKey, this.provider)
      const walletAddress = wallet.address

      // 计算植物统计数据
      const createdDate = new Date(plant.createdAt)
      const completionDate = new Date()
      const journeyDurationDays = Math.ceil(
        (completionDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      const plantData = {
        plantId: plant.id,
        variety: plant.variety,
        finalGrowthValue: plant.growthValue,
        personalityTags: plant.personalityTags,
        journeyDurationDays,
        totalWaterings: wateringRecords.length,
        completionDate: Math.floor(completionDate.getTime() / 1000),
        growthJourney: this.generateGrowthJourney(plant, wateringRecords),
        originalOwner: walletAddress
      }

      // 生成元数据
      const metadata = await MetadataGenerator.generatePlantMetadata(
        await this.contract[CONTRACT_METHODS.TOTAL_SUPPLY](),
        plantData
      )

      // 上传元数据到IPFS
      const metadataHash = await ipfsService.uploadJSON(
        metadata,
        `plant-${plant.id}-metadata.json`
      )
      const metadataURI = ipfsService.getIPFSUrl(metadataHash)

      // 准备合约调用数据
      const contractData = {
        plantId: plantData.plantId,
        variety: plantData.variety,
        finalGrowthValue: plantData.finalGrowthValue,
        personalityTags: plantData.personalityTags,
        journeyDurationDays: plantData.journeyDurationDays,
        totalWaterings: plantData.totalWaterings,
        completionDate: plantData.completionDate,
        growthJourney: plantData.growthJourney,
        originalOwner: plantData.originalOwner
      }

      // 获取带签名者的合约
      const contractWithSigner = await this.getContractWithSigner(privateKey)

      // 估算Gas费用
      const gasEstimate = await contractWithSigner[CONTRACT_METHODS.MINT_PLANT_COMPLETION_NFT].estimateGas(
        walletAddress,
        contractData,
        metadataURI
      )

      // 执行铸造交易
      const tx = await contractWithSigner[CONTRACT_METHODS.MINT_PLANT_COMPLETION_NFT](
        walletAddress,
        contractData,
        metadataURI,
        {
          gasLimit: gasEstimate > GAS_LIMITS.MINT_PLANT_NFT ? gasEstimate : GAS_LIMITS.MINT_PLANT_NFT
        }
      )

      // 等待交易确认
      const receipt = await tx.wait()
      
      // 从事件中获取tokenId
      const mintEvent = receipt.logs.find((log: ethers.Log) => {
        try {
          const parsed = this.contract.interface.parseLog(log)
          return parsed?.name === 'PlantCompletionNFTMinted'
        } catch {
          return false
        }
      })

      if (!mintEvent) {
        throw new Error('Mint event not found in transaction receipt')
      }

      const parsedEvent = this.contract.interface.parseLog(mintEvent)
      const tokenId = parsedEvent?.args?.tokenId?.toString()

      return {
        tokenId: parseInt(tokenId),
        transactionHash: tx.hash,
        metadataHash
      }
    } catch (error) {
      console.error('Plant NFT minting error:', error)
      throw new Error(`Failed to mint plant NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 铸造记忆宝藏NFT
   */
  async mintMemoryTreasureNFT(
    privateKey: string,
    record: WateringRecord,
    audioBlob?: Blob
  ): Promise<{
    tokenId: number
    transactionHash: string
    metadataHash: string
    audioHash?: string
  }> {
    try {
      // 检查记录是否已经铸造过NFT
      const isEligible = await this.contract[CONTRACT_METHODS.IS_RECORD_ELIGIBLE_FOR_NFT](record.id)
      if (!isEligible) {
        throw new Error('Memory NFT already exists')
      }

      const wallet = new ethers.Wallet(privateKey, this.provider)
      const walletAddress = wallet.address

      let audioFileHash = ''
      let audioDuration = 0
      let audioFormat = ''

      // 如果有音频文件，上传到IPFS
      if (audioBlob) {
        const audioFileName = `memory-${record.id}-audio.webm`
        audioFileHash = await ipfsService.uploadAudioBlob(audioBlob, audioFileName)
        audioDuration = Math.floor(audioBlob.size / 1000) // 简单估算
        audioFormat = 'webm'
      }

      // 准备记忆数据
      const memoryData = {
        recordId: record.id,
        plantId: record.plantId,
        memoryText: record.memoryText || '',
        emotionTags: record.emotionTags || [],
        emotionIntensity: record.emotionIntensity || 5,
        growthIncrement: record.growthIncrement || 0,
        coreEvent: record.coreEvent || 'Plant care moment',
        wateringDate: Math.floor(new Date(record.wateringTime || Date.now()).getTime() / 1000),
        audioFileHash,
        audioDuration,
        audioFormat,
        originalOwner: walletAddress
      }

      // 生成元数据
      const metadata = await MetadataGenerator.generateMemoryMetadata(
        await this.contract[CONTRACT_METHODS.TOTAL_SUPPLY](),
        memoryData
      )

      // 上传元数据到IPFS
      const metadataHash = await ipfsService.uploadJSON(
        metadata,
        `memory-${record.id}-metadata.json`
      )
      const metadataURI = ipfsService.getIPFSUrl(metadataHash)

      // 准备合约调用数据
      const contractData = {
        recordId: memoryData.recordId,
        plantId: memoryData.plantId,
        memoryText: memoryData.memoryText,
        emotionTags: memoryData.emotionTags,
        emotionIntensity: memoryData.emotionIntensity,
        growthIncrement: memoryData.growthIncrement,
        coreEvent: memoryData.coreEvent,
        wateringDate: memoryData.wateringDate,
        audioFileHash: memoryData.audioFileHash,
        audioDuration: memoryData.audioDuration,
        audioFormat: memoryData.audioFormat,
        originalOwner: memoryData.originalOwner
      }

      // 获取带签名者的合约
      const contractWithSigner = await this.getContractWithSigner(privateKey)

      // 估算Gas费用
      const gasEstimate = await contractWithSigner[CONTRACT_METHODS.MINT_MEMORY_TREASURE_NFT].estimateGas(
        walletAddress,
        contractData,
        metadataURI
      )

      // 执行铸造交易
      const tx = await contractWithSigner[CONTRACT_METHODS.MINT_MEMORY_TREASURE_NFT](
        walletAddress,
        contractData,
        metadataURI,
        {
          gasLimit: gasEstimate > GAS_LIMITS.MINT_MEMORY_NFT ? gasEstimate : GAS_LIMITS.MINT_MEMORY_NFT
        }
      )

      // 等待交易确认
      const receipt = await tx.wait()
      
      // 从事件中获取tokenId
      const mintEvent = receipt.logs.find((log: ethers.Log) => {
        try {
          const parsed = this.contract.interface.parseLog(log)
          return parsed?.name === 'MemoryTreasureNFTMinted'
        } catch {
          return false
        }
      })

      if (!mintEvent) {
        throw new Error('Mint event not found in transaction receipt')
      }

      const parsedEvent = this.contract.interface.parseLog(mintEvent)
      const tokenId = parsedEvent?.args?.tokenId?.toString()

      return {
        tokenId: parseInt(tokenId),
        transactionHash: tx.hash,
        metadataHash,
        audioHash: audioFileHash || undefined
      }
    } catch (error) {
      console.error('Memory NFT minting error:', error)
      throw new Error(`Failed to mint memory NFT: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 获取用户拥有的植物NFT
   */
  async getPlantNFTsByOwner(walletAddress: string): Promise<number[]> {
    try {
      const tokenIds = await this.contract[CONTRACT_METHODS.GET_PLANT_NFTS_BY_OWNER](walletAddress)
      return tokenIds.map((id: bigint) => parseInt(id.toString()))
    } catch (error) {
      console.error('Error fetching plant NFTs:', error)
      return []
    }
  }

  /**
   * 获取用户拥有的记忆NFT
   */
  async getMemoryNFTsByOwner(walletAddress: string): Promise<number[]> {
    try {
      const tokenIds = await this.contract[CONTRACT_METHODS.GET_MEMORY_NFTS_BY_OWNER](walletAddress)
      return tokenIds.map((id: bigint) => parseInt(id.toString()))
    } catch (error) {
      console.error('Error fetching memory NFTs:', error)
      return []
    }
  }

  /**
   * 获取NFT详细信息
   */
  async getNFTDetails(tokenId: number): Promise<{
    tokenURI: string
    owner: string
    nftType: NFTTypeValue
    data: Record<string, unknown>
  }> {
    try {
      const [tokenURI, owner, nftType] = await Promise.all([
        this.contract[CONTRACT_METHODS.TOKEN_URI](tokenId),
        this.contract[CONTRACT_METHODS.OWNER_OF](tokenId),
        this.contract.tokenTypes(tokenId)
      ])

      let data
      if (nftType === NFTType.PLANT_COMPLETION) {
        data = await this.contract[CONTRACT_METHODS.GET_PLANT_COMPLETION_DATA](tokenId)
      } else {
        data = await this.contract[CONTRACT_METHODS.GET_MEMORY_TREASURE_DATA](tokenId)
      }

      return {
        tokenURI,
        owner,
        nftType,
        data
      }
    } catch (error) {
      console.error('Error fetching NFT details:', error)
      throw new Error('Failed to fetch NFT details')
    }
  }

  /**
   * 检查植物是否可以铸造NFT
   */
  async isPlantEligibleForNFT(plantId: string): Promise<boolean> {
    try {
      return await this.contract[CONTRACT_METHODS.IS_PLANT_ELIGIBLE_FOR_NFT](plantId)
    } catch (error) {
      console.error('Error checking plant eligibility:', error)
      return false
    }
  }

  /**
   * 检查记录是否可以铸造NFT
   */
  async isRecordEligibleForNFT(recordId: string): Promise<boolean> {
    try {
      return await this.contract[CONTRACT_METHODS.IS_RECORD_ELIGIBLE_FOR_NFT](recordId)
    } catch (error) {
      console.error('Error checking record eligibility:', error)
      return false
    }
  }

  /**
   * 生成植物成长历程描述
   */
  private generateGrowthJourney(plant: Plant, records: WateringRecord[]): string {
    const journey = [
      `Started as a ${plant.variety} seed with hopes and dreams.`,
      `Received ${records.length} loving care sessions.`,
      `Grew through various stages: ${plant.currentGrowthStage}.`,
      `Final growth value reached: ${plant.growthValue}/100.`,
      `Personality traits developed: ${plant.personalityTags.join(', ')}.`
    ]

    if (records.length > 0) {
      const emotionalMoments = records.filter(r => r.emotionIntensity && r.emotionIntensity > 7)
      if (emotionalMoments.length > 0) {
        journey.push(`Experienced ${emotionalMoments.length} particularly meaningful moments.`)
      }
    }

    return journey.join(' ')
  }
}

// 创建单例实例
export const nftService = new NFTService()

// 导出类型
export interface NFTMintResult {
  tokenId: number
  transactionHash: string
  metadataHash: string
  audioHash?: string
}

export interface NFTDetails {
  tokenId: number
  tokenURI: string
  owner: string
  nftType: NFTTypeValue
  metadata?: Record<string, unknown>
  contractData: Record<string, unknown>
}
