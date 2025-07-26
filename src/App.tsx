import { useAppInitialization } from '@/hooks/useAppInitialization'
import LoadingProgress from '@/components/LoadingProgress'
import PageContainer from '@/components/PageContainer'
import CreatePlant from '@/pages/CreatePlant'
import DebugPage from '@/pages/DebugPage'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'
import { createHashRouter, RouterProvider, Navigate, useNavigate } from 'react-router'
import { useAppStore } from '@/store'
import type { Plant } from '@/types'
import { useEffect, useRef, useState, useCallback } from 'react'

// 根路由组件 - 检查是否有当前植物
function RootRoute() {
  const { currentPlantId, plants } = useAppStore()
  
  // 如果没有当前植物ID或者植物列表为空，导航到创建植物页面
  if (!currentPlantId || plants.length === 0) {
    return <Navigate to="/createplant" replace />
  }
  
  // 有植物则显示PageContainer（包含HomePage和DigitalLibrary）
  return <PageContainer />
}

// CreatePlant 路由包装组件
function CreatePlantRoute() {
  const navigate = useNavigate()
  const { setCurrentPlantId, addNotification } = useAppStore()
  
  const handlePlantCreated = (plant: Plant) => {
    // 设置当前植物ID
    setCurrentPlantId(plant.id)
    
    // 添加成功通知
    addNotification({
      title: '植物创建成功',
      message: `你的${plant.variety}已经开始成长了！`,
      type: 'success',
      read: false
    })
    
    // 导航到主页
    navigate('/', { replace: true })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900">
      <CreatePlant onPlantCreated={handlePlantCreated} />
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <DebugPage />
  },
  {
    path: '/createplant',
    element: <CreatePlantRoute />
  },
  {
    path: '/debug',
    element: <RootRoute />
  }
]);

function App() {
  const { isAppReady } = useAppInitialization()
  const playerRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const playAudio = useCallback(async () => {
    if (playerRef.current) {
      try {
        await playerRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.log('音频播放失败，可能是浏览器政策限制:', error);
      }
    }
  }, []);

  const toggleAudio = useCallback(async () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      await playAudio();
    }
  }, [isPlaying, playAudio]);

  // 监听用户首次交互
  useEffect(() => {
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      // 用户首次交互后尝试播放音频
      setTimeout(() => {
        playAudio();
      }, 100);
    };

    if (!userInteracted) {
      document.addEventListener('click', handleFirstInteraction, { once: true });
      document.addEventListener('touchstart', handleFirstInteraction, { once: true });
      document.addEventListener('keydown', handleFirstInteraction, { once: true });
    }

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [userInteracted, playAudio]);

  return (
    <>
      <audio 
        ref={playerRef} 
        src='/bgm.mp3' 
        loop 
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* 音频控制按钮 */}
      <button
        onClick={toggleAudio}
        className="fixed top-4 right-4 z-50 bg-green-600 hover:bg-green-700 text-white p-2 rounded-full shadow-lg transition-colors hidden"
        title={isPlaying ? '暂停音乐' : '播放音乐'}
      >
        {isPlaying ? '🔊' : '🔇'}
      </button>
      {/* 只有当应用准备好时才渲染路由 */}
      {isAppReady && <RouterProvider router={router} />}
      
      {/* PWA安装提示 */}
      <PWAInstallPrompt />
      
      {/* PWA更新提示 */}
      <PWAUpdatePrompt />
      
      {/* 加载屏，延迟200毫秒消失 */}
      <LoadingProgress visible={!isAppReady} />
    </>
  )
}

export default App
