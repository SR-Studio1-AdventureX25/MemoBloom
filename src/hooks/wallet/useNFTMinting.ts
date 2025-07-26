import { useState } from 'react'
import { useAppStore } from '@/store'
import type { Plant, WateringRecord } from '@/types'

export function useNFTMinting(walletAddress: string | null) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { updateFavoritePlant, updateFavoriteWateringRecord } = useAppStore()

  const mintPlantNFT = async (plant: Plant) => {
    if (plant.nftMinted || !walletAddress) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // 模拟NFT铸造过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 更新收藏中的植物NFT状态
      updateFavoritePlant(plant.id, {
        nftMinted: true,
        nftAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        nftWalletAddress: walletAddress
      })
    } catch {
      setError('NFT铸造失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  const mintWateringRecordNFT = async (record: WateringRecord) => {
    if (record.nftMinted || !walletAddress) return
    
    setIsLoading(true)
    setError('')
    
    try {
      // 模拟NFT铸造过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 更新收藏中的浇水记录NFT状态
      updateFavoriteWateringRecord(record.id, {
        nftMinted: true,
        nftAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        nftWalletAddress: walletAddress,
        nftMintTime: new Date().toISOString()
      })
    } catch {
      setError('NFT铸造失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError('')

  return {
    isLoading,
    error,
    mintPlantNFT,
    mintWateringRecordNFT,
    clearError
  }
}
