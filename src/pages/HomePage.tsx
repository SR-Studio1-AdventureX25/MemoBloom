import { useCallback, useEffect, useState, useMemo, memo } from 'react'
import { useNavigate } from 'react-router'
import { useAppStore } from '@/store'
import type { Plant } from '@/types'
// import { apiService } from '@/services/api'
import VideoBackground from '@/components/VideoBackground'
import MicrophoneButton from '@/components/MicrophoneButton'
import SyncStatusIndicator from '@/components/SyncStatusIndicator'
import { BloomDrawSystem } from '@/components/BloomDrawSystem'
import { PlantCompletionModal } from '@/components/PlantCompletionModal'

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

// 日期显示组件
const DateDisplay = memo(() => {
  const currentDate = new Date()
  const dateString = currentDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const weekday = currentDate.toLocaleDateString('zh-CN', {
    weekday: 'long'
  })

  return (
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-2xl">
      <div className="text-center">
        <div className="text-white text-4xl font-serif font-bold tracking-wider drop-shadow-2xl" style={{ fontFamily: "'Playfair Display', 'Times New Roman', serif" }}>
          <div className="mb-2">{dateString}</div>
          <div className="text-2xl opacity-90">{weekday}</div>
        </div>
      </div>
    </div>
  )
})

DateDisplay.displayName = 'DateDisplay'

// 消息气泡组件
interface MessageBubbleProps {
  message?: string
  className?: string
}

const MessageBubble = memo<MessageBubbleProps>(({ 
  message, 
  className = "" 
}) => {
  // 判断是否有消息内容
  const hasMessage = message && message.trim().length > 0
  const displayMessage = message || ""
  
  return (
    <div 
      className={`absolute top-56 left-1/2 transform -translate-x-1/2 z-10 transition-opacity duration-500 ease-in-out ${className}`}
      style={{ opacity: hasMessage ? 1 : 0 }}
    >
      <div className="relative inline-block">
        {/* SVG 气泡背景 */}
        <svg width="293" height="118" viewBox="0 0 293 118" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg transform scale-x-[-1]">
          {/* 简化的装饰线条 */}
          <path d="M8 35C28 30 48 28 68 30M72 28C92 27 107 28.5 117 30" stroke="#FF1744" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9"/>
          <path d="M195 2C215 -1 235 -1 255 2M270 5C285 12 295 26 296 30" stroke="#FFD600" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9"/>
          <path d="M297 45C294 65 285 83 280 85" stroke="#1DE9B6" strokeWidth="3.8" strokeLinecap="round" fill="none" opacity="0.8"/>
          <path d="M250 102C210 104 180 102 160 110" stroke="#E91E63" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.9"/>
          <path d="M-2 50C-5 70 2 87 8 89M-7 35C0 15 10 7 20 5" stroke="#8BC34A" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.8"/>
          {/* 主气泡形状 */}
          <path d="M129.176 94.645C129.176 99.3906 128.028 110.305 123.434 116C129.45 115.492 144.517 110.509 156.658 94.645C173.476 92.9501 211.54 89.662 229.26 90.0688C251.41 90.5773 287.095 94.1364 290.787 51.9347C294.479 9.733 249.359 7.69922 221.467 7.69922C193.574 7.69922 92.6703 1.08945 68.8799 2.10636C45.0895 3.12327 3.25133 -0.944528 2.02079 49.9009C0.790251 100.746 54.5236 94.645 72.9817 94.645C91.4398 94.645 123.433 89.0522 129.176 94.645Z" fill="white" stroke="white" strokeWidth="2.16" strokeLinecap="round"/>
        </svg>
        
        {/* 气泡内的文字 */}
        <div className="absolute inset-0 flex items-center justify-center px-2">
          <span className="text-gray-800 text-xl leading-relaxed text-center font-medium relative -top-2" style={{ fontFamily: "'DingTalk JinBuTi', 'DingTalk Sans', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif" }}>
            {displayMessage}
          </span>
        </div>
      </div>
    </div>
  )
})

MessageBubble.displayName = 'MessageBubble'

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
  onWateringComplete: (success: boolean, message?: string, emotion?: 'happy' | 'sad') => void
  onRecordingStateChange?: (isRecording: boolean) => void
}

const MicrophoneContainer = memo<MicrophoneContainerProps>(({ 
  plantId, 
  currentGrowthValue, 
  onWateringComplete,
  onRecordingStateChange
}) => (
  <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-12">
    <MicrophoneButton 
      plantId={plantId}
      currentGrowthValue={currentGrowthValue}
      onWateringComplete={onWateringComplete}
      onRecordingStateChange={onRecordingStateChange}
    />
  </div>
))

MicrophoneContainer.displayName = 'MicrophoneContainer'

interface HomePageProps {
  onRecordingStateChange?: (isRecording: boolean) => void
}

export default function HomePage({ onRecordingStateChange }: HomePageProps = {}) {
  const { plants, currentPlantId, isOnline, addNotification, addFavoritePlant, setCurrentPlantId } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [aiMessage, setAiMessage] = useState<string>('') // AI生成的消息
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completedPlant, setCompletedPlant] = useState<Plant | null>(null)
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
    
    // 数据同步现在由SyncStatusIndicator和useSmartSync处理
  }, [checkCurrentPlant])

  // 处理在线且无本地数据的情况
  const handleOnlineWithNoData = useCallback(async () => {
    // 无本地数据时，直接设置加载完成
    // 数据获取现在由SyncStatusIndicator和useSmartSync处理
    setIsLoading(false)
  }, [])

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

  // 植物完成检测 - 监听植物阶段变化
  useEffect(() => {
    if (currentPlant && currentPlant.currentGrowthStage === 'fruiting' && !showCompletionModal) {
      console.log("sadasdsadasdasdasdasdasdad")
      // 植物达到fruiting阶段，触发成就弹窗
      setCompletedPlant(currentPlant)
      setShowCompletionModal(true)
      
      // 自动加入收藏
      addFavoritePlant(currentPlant)
      
      // 添加成就通知
      addNotification({
        title: '🏆 植物养成完成！',
        message: `恭喜你成功养成了一株${currentPlant.variety}！`,
        type: 'success',
        read: false
      })
    }
  }, [currentPlant?.currentGrowthStage, currentPlant, showCompletionModal, addFavoritePlant, addNotification])

  // 处理成就弹窗关闭
  const handleCompletionModalClose = useCallback(() => {
    setShowCompletionModal(false)
    setCompletedPlant(null)
    
    // 清空当前植物ID，强制玩家进入创建植物界面
    setCurrentPlantId(null)
    
    // 导航到创建植物页面
    navigate('/createplant', { replace: true })
  }, [setCurrentPlantId, navigate])

  // 浇水完成回调 - 使用 useCallback 优化
  const handleWateringComplete = useCallback((success: boolean, message?: string, emotion?: 'happy' | 'sad') => {
    const notificationTitle = success ? '浇水成功' : '浇水失败'
    const notificationMessage = message || (success ? '你的植物很开心！' : '请稍后重试')
    const notificationType = success ? 'success' : 'error'

    addNotification({
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      read: false
    })
    
    // 如果有AI生成的消息，显示在气泡中
    if (success && message && message !== '浇水成功！你的植物很开心 🌱') {
      setAiMessage(message)
      
      // 5秒后清除消息
      setTimeout(() => {
        setAiMessage('')
      }, 5000)
    }
    
    // 植物情感反应的通知（播放列表更新已在MicrophoneButton中处理）
    if (success && emotion && currentPlant) {
      const emotionMessages = {
        happy: '你的植物很开心！🌱✨',
        sad: '你的植物有点难过 😢💧'
      } as const
      
      addNotification({
        title: `植物情感反应: ${emotion === 'happy' ? '开心' : '悲伤'}`,
        message: emotionMessages[emotion],
        type: 'info',
        read: false
      })
    }
    
    // 数据刷新现在由SyncStatusIndicator和useSmartSync自动处理
  }, [addNotification, isOnline, currentPlant, setAiMessage])

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
        {/* 同步状态指示器 */}
        <SyncStatusIndicator className="absolute top-4 left-4 z-10" />

        {/* 在线状态指示器 */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white/80 text-sm">
            {isOnline ? '在线' : '离线'}
          </span>
        </div>

        {/* 日期显示 */}
        <DateDisplay />

        {/* 消息气泡 - 显示AI生成的消息 */}
        <MessageBubble message={aiMessage} />

        {/* 开花记忆抽取系统 */}
        <div className="absolute top-80 left-1/2 transform -translate-x-1/2 z-10">
          <BloomDrawSystem />
        </div>

        {/* 视频背景 */}
        <VideoBackground showOverlay={isRecording} />


        {/* 麦克风按钮 */}
        <MicrophoneContainer 
          plantId={currentPlant.id}
          currentGrowthValue={currentPlant.growthValue}
          onWateringComplete={handleWateringComplete}
          onRecordingStateChange={(isRecording) => {
            setIsRecording(isRecording)
            onRecordingStateChange?.(isRecording)
          }}
        />

        {/* NFT状态指示器 */}
        {currentPlant.nftMinted && <NFTIndicator />}

        {/* 植物完成成就弹窗 */}
        <PlantCompletionModal 
          plant={completedPlant}
          isOpen={showCompletionModal}
          onClose={handleCompletionModalClose}
        />
      </div>
    )
  }

  return <ErrorState onReload={handleReload} />
}
