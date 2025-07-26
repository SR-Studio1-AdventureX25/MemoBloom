import type { Plant, WateringRecord } from '@/types'

interface NFTManagementProps {
  favoritePlants: Plant[]
  favoriteWateringRecords: WateringRecord[]
  onMintPlantNFT: (plant: Plant) => void
  onMintWateringRecordNFT: (record: WateringRecord) => void
  isLoading: boolean
  error: string
}

export default function NFTManagement({
  favoritePlants,
  favoriteWateringRecords,
  onMintPlantNFT,
  onMintWateringRecordNFT,
  isLoading,
  error
}: NFTManagementProps) {
  return (
    <div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-6 backdrop-blur-sm">
      <h3 className="text-white font-semibold mb-4">收藏与NFT管理</h3>
      
      {/* 收藏植物 */}
      {favoritePlants.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white/80 text-sm font-medium mb-3">收藏植物 ({favoritePlants.length})</h4>
          <div className="space-y-3">
            {favoritePlants.map((plant) => (
              <div key={plant.id} className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{plant.variety}</div>
                    <div className="text-white/60 text-xs">
                      {plant.currentGrowthStage} • 成长值: {plant.growthValue}
                    </div>
                    <div className="text-white/50 text-xs">
                      {new Date(plant.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="ml-3">
                    {plant.nftMinted ? (
                      <div className="flex items-center space-x-1">
                        <span className="text-purple-400 text-xs">✨ 已上链</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onMintPlantNFT(plant)}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs py-1 px-3 rounded-md transition-all duration-200 disabled:opacity-50"
                      >
                        {isLoading ? '铸造中...' : '铸造NFT'}
                      </button>
                    )}
                  </div>
                </div>
                {plant.nftMinted && plant.nftAddress && (
                  <div className="mt-2 text-purple-300 text-xs font-mono break-all">
                    {plant.nftAddress}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 收藏浇水记录 */}
      {favoriteWateringRecords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-white/80 text-sm font-medium mb-3">收藏记忆 ({favoriteWateringRecords.length})</h4>
          <div className="space-y-3">
            {favoriteWateringRecords.map((record) => (
              <div key={record.id} className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      {record.coreEvent || '记忆片段'}
                    </div>
                    <div className="text-white/60 text-xs">
                      情感强度: {record.emotionIntensity}/10 • 成长值: +{record.growthIncrement}
                    </div>
                    <div className="text-white/50 text-xs">
                      {new Date(record.wateringTime).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="ml-3">
                    {record.nftMinted ? (
                      <div className="flex items-center space-x-1">
                        <span className="text-purple-400 text-xs">✨ 已上链</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onMintWateringRecordNFT(record)}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-xs py-1 px-3 rounded-md transition-all duration-200 disabled:opacity-50"
                      >
                        {isLoading ? '铸造中...' : '铸造NFT'}
                      </button>
                    )}
                  </div>
                </div>
                {record.nftMinted && record.nftAddress && (
                  <div className="mt-2 text-purple-300 text-xs font-mono break-all">
                    {record.nftAddress}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 空状态 */}
      {favoritePlants.length === 0 && favoriteWateringRecords.length === 0 && (
        <div className="text-center text-white/50 py-8">
          <div className="text-4xl mb-2">🎨</div>
          <p>暂无收藏项目</p>
          <p className="text-sm mt-1">在数字图书馆中收藏植物和记忆</p>
        </div>
      )}
      
      {/* 错误提示 */}
      {error && (
        <div className="text-red-400 text-sm mt-4 text-center">{error}</div>
      )}
    </div>
  )
}
