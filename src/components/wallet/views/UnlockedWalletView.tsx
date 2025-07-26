import WalletInfo from '@/components/wallet/info/WalletInfo'
import NFTManagement from '@/components/wallet/nft/NFTManagement'
import type { Plant, WateringRecord } from '@/types'

interface UnlockedWalletViewProps {
  walletAddress: string
  favoritePlants: Plant[]
  favoriteWateringRecords: WateringRecord[]
  onMintPlantNFT: (plant: Plant) => void
  onMintWateringRecordNFT: (record: WateringRecord) => void
  onLockWallet: () => void
  onDeleteWallet: () => void
  isLoading: boolean
  error: string
}

export default function UnlockedWalletView({
  walletAddress,
  favoritePlants,
  favoriteWateringRecords,
  onMintPlantNFT,
  onMintWateringRecordNFT,
  onLockWallet,
  onDeleteWallet,
  isLoading,
  error
}: UnlockedWalletViewProps) {
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">💼</div>
        <h1 className="text-3xl font-bold text-white mb-2">我的钱包</h1>
        <p className="text-white/70">专为MemoBloom NFT设计</p>
      </div>

      {/* 钱包地址卡片 */}
      <WalletInfo walletAddress={walletAddress} />

      {/* NFT资产和收藏管理 */}
      <NFTManagement
        favoritePlants={favoritePlants}
        favoriteWateringRecords={favoriteWateringRecords}
        onMintPlantNFT={onMintPlantNFT}
        onMintWateringRecordNFT={onMintWateringRecordNFT}
        isLoading={isLoading}
        error={error}
      />

      {/* 操作按钮 */}
      <div className="space-y-3">
        <button
          onClick={onLockWallet}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
        >
          <span>🔒</span>
          <span>锁定钱包</span>
        </button>

        <button
          onClick={onDeleteWallet}
          className="w-full text-red-400 hover:text-red-300 py-3 px-4 rounded-lg transition-all duration-200 text-sm"
        >
          删除钱包
        </button>
      </div>
    </div>
  )
}
