import { useCallback, useEffect, useState, useMemo, memo } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore } from '@/store'
import { apiService } from '@/services/api'
import VideoBackground from '@/components/VideoBackground'
import MicrophoneButton from '@/components/MicrophoneButton'

// 常量
const LOADING_TEXT = '检查植物状态中...'
const OFFLINE_NOTIFICATION = {
  title: '离线模式',
  message: '当前处于离线状态，创建的植物将在联网后同步',
  type: 'warning' as const,
  read: false
}

// Loading 状态组件
const LoadingState = memo(() => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white">{LOADING_TEXT}</p>
    </div>
  </div>
))

LoadingState.displayName = 'LoadingState'

// 错误状态组件
interface ErrorStateProps {
  onReload: () => void
}

const ErrorState = memo<ErrorStateProps>(({ onReload }) => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center text-white">
      <h2 className="text-xl font-semibold mb-2">出现了问题</h2>
      <p className="text-white/60 mb-4">无法加载植物数据</p>
      <button
        onClick={onReload}
        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium transition-colors"
      >
        重新加载
      </button>
    </div>
  </div>
))

ErrorState.displayName = 'ErrorState'

// NFT 状态指示器组件
const NFTIndicator = memo(() => (
  <div className="absolute top-20 right-4 z-10">
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
      NFT已铸造
    </div>
  </div>
))

NFTIndicator.displayName = 'NFTIndicator'

// 麦克风按钮容器组件
interface MicrophoneContainerProps {
  plantId: string
  currentGrowthValue: number
  onWateringComplete: (success: boolean, message?: string) => void
}

const MicrophoneContainer = memo<MicrophoneContainerProps>(({ 
  plantId, 
  currentGrowthValue, 
  onWateringComplete 
}) => (
  <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-8">
    <MicrophoneButton 
      plantId={plantId}
      currentGrowthValue={currentGrowthValue}
      onWateringComplete={onWateringComplete}
    />
  </div>
))

MicrophoneContainer.displayName = 'MicrophoneContainer'

export default function HomePage() {
  const { plants, currentPlantId, setPlants, isOnline, addNotification } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // 计算当前植物 - 使用 useMemo 优化性能
  const currentPlant = useMemo(() => {
    return currentPlantId ? plants.find(p => p.id === currentPlantId) : null
  }, [currentPlantId, plants])

  // 检查当前植物是否存在，如果不存在就跳转到创建页面
  const checkCurrentPlant = useCallback(() => {
    if (plants.length > 0 && (!currentPlantId || !plants.find(p => p.id === currentPlantId))) {
      // 如果有植物但没有选择或选择的植物不存在，跳转到创建页面
      navigate('/createplant', { replace: true })
      return false
    }
    return true
  }, [plants, currentPlantId, navigate])

  // 统一的植物数据获取函数
  const fetchPlants = useCallback(async () => {
    try {
      const response = await apiService.plants.getAll()
      const serverPlants = response.data

      if (serverPlants && serverPlants.length > 0) {
        setPlants(serverPlants)
        return serverPlants
      }
      return []
    } catch (error) {
      console.error('获取植物数据失败:', error)
      throw error
    }
  }, [setPlants])

  // 处理离线且无本地数据的情况
  const handleOfflineWithNoData = useCallback(() => {
    addNotification(OFFLINE_NOTIFICATION)
  }, [addNotification])

  // 处理本地数据存在的情况
  const handleLocalData = useCallback(async () => {
    // 检查当前植物是否存在，如果不存在就跳转
    if (!checkCurrentPlant()) {
      return
    }
    
    setIsLoading(false)
    
    // 如果在线，尝试同步最新数据
    if (isOnline) {
      try {
        await fetchPlants() // 仅同步数据
      } catch (error) {
        console.error('同步植物数据失败:', error)
      }
    }
  }, [checkCurrentPlant, isOnline, fetchPlants])

  // 处理在线且无本地数据的情况
  const handleOnlineWithNoData = useCallback(async () => {
    try {
      await fetchPlants() // 获取数据
      // 注意：如果服务器上没有植物，路由会自动处理跳转到创建页面
    } catch {
      // 网络错误时，路由会自动处理跳转
    }
  }, [fetchPlants])

  // 检查植物状态 - 简化后的主逻辑
  const checkPlantStatus = useCallback(async () => {
    try {
      setIsLoading(true)

      if (plants.length > 0) {
        await handleLocalData()
        return
      }

      if (isOnline) {
        await handleOnlineWithNoData()
      } else {
        handleOfflineWithNoData()
      }
    } catch (error) {
      console.error('检查植物状态失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [plants.length, isOnline, handleLocalData, handleOnlineWithNoData, handleOfflineWithNoData])

  // 检查植物状态
  useEffect(() => {
    checkPlantStatus()
  }, [checkPlantStatus])

  // 浇水完成回调 - 使用 useCallback 优化
  const handleWateringComplete = useCallback((success: boolean, message?: string) => {
    const notificationTitle = success ? '浇水成功' : '浇水失败'
    const notificationMessage = message || (success ? '你的植物很开心！' : '请稍后重试')
    const notificationType = success ? 'success' : 'error'

    addNotification({
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      read: false
    })
    
    // 刷新植物数据
    if (success && isOnline && currentPlant) {
      fetchPlants().catch(error => {
        console.error('刷新植物数据失败:', error)
      })
    }
  }, [addNotification, isOnline, currentPlant, fetchPlants])

  // 重新加载回调
  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  // 主渲染逻辑
  if (isLoading) {
    return <LoadingState />
  }

  if (currentPlant) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* 在线状态指示器 */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white/80 text-sm">
            {isOnline ? '在线' : '离线'}
          </span>
        </div>

        {/* 视频背景 */}
        <VideoBackground />


        {/* 麦克风按钮 */}
        <MicrophoneContainer 
          plantId={currentPlant.id}
          currentGrowthValue={currentPlant.growthValue}
          onWateringComplete={handleWateringComplete}
        />

        {/* NFT状态指示器 */}
        {currentPlant.nftMinted && <NFTIndicator />}
      </div>
    )
  }

  return <ErrorState onReload={handleReload} />
}
