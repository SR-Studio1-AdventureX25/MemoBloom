import { useState } from 'react'
import { useAppStore } from '@/store'
import { apiService } from '@/services/api'
import { PlantVariety, type Plant } from '@/types'

interface CreatePlantProps {
  onPlantCreated: (plant: Plant) => void
  onCancel?: () => void
}

export default function CreatePlant({ onPlantCreated, onCancel }: CreatePlantProps) {
  const { isOnline, addNotification, addPlant } = useAppStore()
  const [selectedVariety, setSelectedVariety] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)

  // 植物品种选项
  const plantOptions = [
    {
      value: PlantVariety.SUNFLOWER,
      name: '向日葵',
      description: '阳光开朗，积极向上',
      emoji: '🌻',
      color: 'from-yellow-400 to-orange-500'
    },
  ]

  // 创建植物
  const handleCreatePlant = async () => {
    if (!selectedVariety) {
      addNotification({
        title: '请选择植物品种',
        message: '请先选择一个你喜欢的植物品种',
        type: 'warning',
        read: false
      })
      return
    }

    setIsCreating(true)

    try {
      if (isOnline) {
        // 在线创建
        const response = await apiService.plants.create({
          variety: selectedVariety
        })

        const newPlant = response.data.plant
        addPlant(newPlant)
        onPlantCreated(newPlant)

        addNotification({
          title: '植物创建成功',
          message: `你的${selectedVariety}已经开始成长了！`,
          type: 'success',
          read: false
        })
      } else {
        // 离线创建（创建本地植物记录）
        const newPlant: Plant = {
          id: `local_${Date.now()}`, // 临时本地ID
          variety: selectedVariety,
          currentGrowthStage: 'seed',
          growthValue: 0,
          lastWateringTime: '',
          userRecentStatus: '',
          personalityTags: [],
          nftMinted: false,
          createdAt: new Date().toISOString()
        }

        addPlant(newPlant)
        onPlantCreated(newPlant)

        addNotification({
          title: '植物创建成功（离线）',
          message: '植物将在连接网络后同步到服务器',
          type: 'info',
          read: false
        })
      }
    } catch (error) {
      console.error('创建植物失败:', error)
      addNotification({
        title: '创建失败',
        message: '植物创建失败，请稍后重试',
        type: 'error',
        read: false
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            选择你的植物伙伴
          </h1>
          <p className="text-white/80">
            每种植物都有独特的性格，选择一个与你心灵相通的伙伴吧
          </p>
          
          {/* 在线状态指示 */}
          <div className="flex items-center justify-center mt-4">
            <div className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-white/60 text-sm">
              {isOnline ? '在线模式' : '离线模式'}
            </span>
          </div>
        </div>

        {/* 植物品种选择 */}
        <div className="space-y-3 mb-8">
          {plantOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedVariety(option.value)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedVariety === option.value
                  ? 'border-white bg-white/10 shadow-lg scale-105'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* 表情符号 */}
                <div className="text-3xl">
                  {option.emoji}
                </div>
                
                {/* 植物信息 */}
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-semibold text-white">
                    {option.name}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {option.description}
                  </p>
                </div>

                {/* 选中指示器 */}
                {selectedVariety === option.value && (
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 创建按钮 */}
        <div className="space-y-3">
          <button
            onClick={handleCreatePlant}
            disabled={isCreating || !selectedVariety}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
              isCreating || !selectedVariety
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            {isCreating ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                创建中...
              </div>
            ) : (
              '开始培养我的植物'
            )}
          </button>

          {/* 取消按钮 */}
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isCreating}
              className="w-full py-3 px-6 rounded-xl font-medium text-white/80 border border-white/20 hover:bg-white/10 transition-colors"
            >
              取消
            </button>
          )}
        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            植物一旦创建就会开始它的成长之旅
          </p>
          <p className="text-white/60 text-sm mt-1">
            记得经常与它交流哦 💚
          </p>
        </div>
      </div>
    </div>
  )
}
