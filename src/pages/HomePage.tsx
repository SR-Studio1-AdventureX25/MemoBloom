import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { apiService } from '@/services/api'
import type { Plant } from '@/types'
import CreatePlant from './CreatePlant'
import VideoBackground from '@/components/VideoBackground'
import MicrophoneButton from '@/components/MicrophoneButton'

export default function HomePage() {
  const { plants, currentPlant, setPlants, setCurrentPlant, isOnline, addNotification } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreatePlant, setShowCreatePlant] = useState(false)

  // 检查植物状态
  useEffect(() => {
    checkPlantStatus()
  }, [])

  const checkPlantStatus = async () => {
    try {
      setIsLoading(true)

      // 如果本地有植物数据，先使用本地数据
      if (plants.length > 0) {
        setCurrentPlant(plants[0]) // 使用第一个植物作为当前植物
        setIsLoading(false)
        
        // 如果在线，尝试同步最新数据
        if (isOnline) {
          syncPlantData()
        }
        return
      }

      // 如果在线，从服务器获取植物数据
      if (isOnline) {
        try {
          const response = await apiService.plants.getAll()
          const serverPlants = response.data

          if (serverPlants && serverPlants.length > 0) {
            setPlants(serverPlants)
            setCurrentPlant(serverPlants[0])
          } else {
            // 服务器上也没有植物，显示创建界面
            setShowCreatePlant(true)
          }
        } catch (error) {
          console.error('获取植物数据失败:', error)
          // 网络错误，显示创建界面（可能是新用户）
          setShowCreatePlant(true)
        }
      } else {
        // 离线且没有本地数据，显示创建界面
        setShowCreatePlant(true)
        addNotification({
          title: '离线模式',
          message: '当前处于离线状态，创建的植物将在联网后同步',
          type: 'warning',
          read: false
        })
      }
    } catch (error) {
      console.error('检查植物状态失败:', error)
      setShowCreatePlant(true)
    } finally {
      setIsLoading(false)
    }
  }

  // 同步植物数据
  const syncPlantData = async () => {
    try {
      const response = await apiService.plants.getAll()
      const serverPlants = response.data

      if (serverPlants && serverPlants.length > 0) {
        setPlants(serverPlants)
        // 更新当前植物数据
        const updatedCurrentPlant = serverPlants.find(p => p.id === currentPlant?.id)
        if (updatedCurrentPlant) {
          setCurrentPlant(updatedCurrentPlant)
        }
      }
    } catch (error) {
      console.error('同步植物数据失败:', error)
    }
  }

  // 植物创建成功回调
  const handlePlantCreated = (newPlant: Plant) => {
    setShowCreatePlant(false)
    setCurrentPlant(newPlant)
    addNotification({
      title: '植物创建成功',
      message: `你的${newPlant.variety}已经开始成长了！`,
      type: 'success',
      read: false
    })
  }

  // 浇水完成回调
  const handleWateringComplete = (success: boolean, message?: string) => {
    if (success) {
      addNotification({
        title: '浇水成功',
        message: message || '你的植物很开心！',
        type: 'success',
        read: false
      })
      
      // 刷新植物数据
      if (isOnline && currentPlant) {
        syncPlantData()
      }
    } else {
      addNotification({
        title: '浇水失败',
        message: message || '请稍后重试',
        type: 'error',
        read: false
      })
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">检查植物状态中...</p>
        </div>
      </div>
    )
  }

  // 需要创建植物
  if (showCreatePlant || (!currentPlant && plants.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900">
        <CreatePlant 
          onPlantCreated={handlePlantCreated}
          onCancel={() => setShowCreatePlant(false)}
        />
      </div>
    )
  }

  // 有植物，显示主界面
  if (currentPlant) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* 视频背景 */}
        <VideoBackground />
        
        {/* 植物信息覆盖层 */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            {/* 植物信息 */}
            <div className="text-white">
              <h2 className="text-lg font-semibold">{currentPlant.variety}</h2>
              <p className="text-sm text-white/80">
                成长阶段: {currentPlant.currentGrowthStage}
              </p>
              <p className="text-sm text-white/80">
                成长值: {currentPlant.growthValue}
              </p>
            </div>
            
            {/* 在线状态指示器 */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-white/80 text-sm">
                {isOnline ? '在线' : '离线'}
              </span>
            </div>
          </div>
        </div>

        {/* 底部植物详情 */}
        <div className="absolute bottom-20 left-0 right-0 z-10 p-4">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-white">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">上次浇水:</span>
                <p className="font-medium">
                  {currentPlant.lastWateringTime ? 
                    new Date(currentPlant.lastWateringTime).toLocaleDateString() : 
                    '还未浇水'
                  }
                </p>
              </div>
              <div>
                <span className="text-white/60">近期状况:</span>
                <p className="font-medium">
                  {currentPlant.userRecentStatus || '暂无记录'}
                </p>
              </div>
            </div>
            
            {/* 个性标签 */}
            {currentPlant.personalityTags && currentPlant.personalityTags.length > 0 && (
              <div className="mt-3">
                <span className="text-white/60 text-sm">个性标签:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {currentPlant.personalityTags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/20 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 麦克风按钮 */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-8">
          <MicrophoneButton 
            plantId={currentPlant.id}
            currentGrowthValue={currentPlant.growthValue}
            onWateringComplete={handleWateringComplete}
          />
        </div>

        {/* NFT状态指示器 */}
        {currentPlant.nftMinted && (
          <div className="absolute top-20 right-4 z-10">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
              NFT已铸造
            </div>
          </div>
        )}
      </div>
    )
  }

  // 其他情况显示错误
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <h2 className="text-xl font-semibold mb-2">出现了问题</h2>
        <p className="text-white/60 mb-4">无法加载植物数据</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          重新加载
        </button>
      </div>
    </div>
  )
}
