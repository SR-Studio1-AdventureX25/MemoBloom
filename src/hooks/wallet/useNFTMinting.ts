import { useState } from 'react'
import { useAppStore } from '@/store'
import { useWalletStore } from '@/store/walletStore'
import { nftService } from '@/services/nftService'
import { PrivateKey } from '@injectivelabs/sdk-ts'
import type { Plant, WateringRecord } from '@/types'

export function useNFTMinting(walletAddress: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { updateFavoritePlant, updateFavoriteWateringRecord, wateringRecords } = useAppStore()
  const { exportMnemonic, isWalletLocked } = useWalletStore()

  const mintPlantNFT = async (plant: Plant) => {
    if (plant.nftMinted || !walletAddress) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // 检查钱包是否解锁
      if (isWalletLocked) {
        throw new Error('钱包已锁定，请先解锁')
      }

      // 获取助记词并生成私钥
      const mnemonic = await exportMnemonic('')
      if (!mnemonic) {
        throw new Error('无法获取钱包助记词')
      }

      // 使用Injective SDK直接从助记词生成私钥
      const privateKeyObj = PrivateKey.fromMnemonic(mnemonic.trim(), "m/44'/60'/0'/0/0")
      const privateKey = privateKeyObj.toPrivateKeyHex()

      // 检查植物是否可以铸造NFT
      const isEligible = await nftService.isPlantEligibleForNFT(plant.id)
      if (!isEligible) {
        throw new Error('该植物已经铸造过NFT')
      }

      // 获取植物相关的浇水记录
      const plantWateringRecords = wateringRecords.filter(record => record.plantId === plant.id)

      // 铸造植物完成NFT
      const result = await nftService.mintPlantCompletionNFT(
        privateKey,
        plant,
        plantWateringRecords
      )
      
      // 更新收藏中的植物NFT状态
      updateFavoritePlant(plant.id, {
        nftMinted: true,
        nftAddress: `${result.tokenId}`, // 使用tokenId作为地址标识
        nftWalletAddress: walletAddress
      })

      return {
        success: true,
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        metadataHash: result.metadataHash
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'NFT铸造失败，请重试'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }
  
  const mintWateringRecordNFT = async (record: WateringRecord, audioBlob?: Blob) => {
    if (record.nftMinted || !walletAddress) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // 检查钱包是否解锁
      if (isWalletLocked) {
        throw new Error('钱包已锁定，请先解锁')
      }

      // 获取助记词并生成私钥
      const mnemonic = await exportMnemonic('')
      if (!mnemonic) {
        throw new Error('无法获取钱包助记词')
      }

      // 使用Injective SDK直接从助记词生成私钥
      const privateKeyObj = PrivateKey.fromMnemonic(mnemonic.trim(), "m/44'/60'/0'/0/0")
      const privateKey = privateKeyObj.toPrivateKeyHex()

      // 检查记录是否可以铸造NFT
      const isEligible = await nftService.isRecordEligibleForNFT(record.id)
      if (!isEligible) {
        throw new Error('该记录已经铸造过NFT')
      }

      // 铸造记忆宝藏NFT
      const result = await nftService.mintMemoryTreasureNFT(
        privateKey,
        record,
        audioBlob
      )
      
      // 更新收藏中的浇水记录NFT状态
      updateFavoriteWateringRecord(record.id, {
        nftMinted: true,
        nftAddress: `${result.tokenId}`, // 使用tokenId作为地址标识
        nftWalletAddress: walletAddress,
        nftMintTime: new Date().toISOString()
      })

      return {
        success: true,
        tokenId: result.tokenId,
        transactionHash: result.transactionHash,
        metadataHash: result.metadataHash,
        audioHash: result.audioHash
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'NFT铸造失败，请重试'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const checkPlantEligibility = async (plantId: string): Promise<boolean> => {
    try {
      return await nftService.isPlantEligibleForNFT(plantId)
    } catch {
      return false
    }
  }

  const checkRecordEligibility = async (recordId: string): Promise<boolean> => {
    try {
      return await nftService.isRecordEligibleForNFT(recordId)
    } catch {
      return false
    }
  }

  const getUserNFTs = async () => {
    if (!walletAddress) return { plantNFTs: [], memoryNFTs: [] }
    
    try {
      const [plantNFTs, memoryNFTs] = await Promise.all([
        nftService.getPlantNFTsByOwner(walletAddress),
        nftService.getMemoryNFTsByOwner(walletAddress)
      ])
      
      return { plantNFTs, memoryNFTs }
    } catch (err) {
      console.error('获取用户NFT失败:', err)
      return { plantNFTs: [], memoryNFTs: [] }
    }
  }

  const getNFTDetails = async (tokenId: number) => {
    try {
      return await nftService.getNFTDetails(tokenId)
    } catch (err) {
      console.error('获取NFT详情失败:', err)
      return null
    }
  }

  const clearError = () => setError('')

  return {
    isLoading,
    error,
    mintPlantNFT,
    mintWateringRecordNFT,
    checkPlantEligibility,
    checkRecordEligibility,
    getUserNFTs,
    getNFTDetails,
    clearError
  }
}
