import { useAppInitialization } from '@/hooks/useAppInitialization'
import LoadingProgress from '@/components/LoadingProgress'
import PageContainer from '@/components/PageContainer'
import CreatePlant from '@/pages/CreatePlant'
import DebugPage from '@/pages/DebugPage'
import BloomTestPage from '@/pages/BloomTestPage'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'
import { createHashRouter, RouterProvider, Navigate, useNavigate } from 'react-router'
import { useAppStore } from '@/store'
import type { Plant } from '@/types'
import { useEffect, useRef, useState, useCallback } from 'react'

// 根路由组件 - 检查是否有当前植物
function RootRoute({ onRecordingStateChange }: { onRecordingStateChange: (isRecording: boolean) => void }) {
  const { currentPlantId, plants, setCurrentPlantId } = useAppStore()
  
  // 🔥 修复：更安全的路由逻辑
  // 只有在真的没有植物时才跳转到创建页面
  if (plants.length === 0) {
    return <Navigate to="/createplant" replace />
  }
  
  // 如果有植物但没有选中的，自动选择第一个
  if (!currentPlantId) {
    const firstPlant = plants[0]
    if (firstPlant) {
      setCurrentPlantId(firstPlant.id)
    }
  }
  
  // 有植物则显示PageContainer（包含HomePage和DigitalLibrary）
  return <PageContainer onRecordingStateChange={onRecordingStateChange} />
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

function App() {
  const { isAppReady } = useAppInitialization()
  const playerRef = useRef<HTMLAudioElement>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const volumeAnimationRef = useRef<number | null>(null);

  const playAudio = useCallback(async () => {
    if (playerRef.current) {
      try {
        await playerRef.current.play();
      } catch (error) {
        console.log('音频播放失败，可能是浏览器政策限制:', error);
      }
    }
  }, []);

  // 平滑调整音量
  const fadeVolume = useCallback((targetVolume: number, duration: number = 500) => {
    if (!playerRef.current) return;

    // 取消之前的动画
    if (volumeAnimationRef.current) {
      cancelAnimationFrame(volumeAnimationRef.current);
    }

    const startVolume = playerRef.current.volume;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数实现平滑过渡
      const easeProgress = progress * (2 - progress); // ease-out
      const newVolume = startVolume + (targetVolume - startVolume) * easeProgress;
      
      if (playerRef.current) {
        playerRef.current.volume = newVolume;
      }

      if (progress < 1) {
        volumeAnimationRef.current = requestAnimationFrame(animate);
      } else {
        volumeAnimationRef.current = null;
      }
    };

    volumeAnimationRef.current = requestAnimationFrame(animate);
  }, []);

  // 处理录音状态变化
  const handleRecordingStateChange = useCallback((isRecording: boolean) => {
    if (isRecording) {
      // 录音开始时，将音量降低到20%
      fadeVolume(0.2, 300);
    } else {
      // 录音结束时，恢复音量到100%
      fadeVolume(1.0, 500);
    }
  }, [fadeVolume]);

  // 清理动画
  useEffect(() => {
    return () => {
      if (volumeAnimationRef.current) {
        cancelAnimationFrame(volumeAnimationRef.current);
      }
    };
  }, []);

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

  // 创建动态路由器
  const router = createHashRouter([
    {
      path: '/',
      element: <RootRoute onRecordingStateChange={handleRecordingStateChange} />
    },
    {
      path: '/createplant',
      element: <CreatePlantRoute />
    },
    {
      path: '/debug',
      element: <DebugPage />
    },
    {
      path: '/bloom-test',
      element: <BloomTestPage />
    }
  ]);

  return (
    <>
      <audio 
        ref={playerRef} 
        src='/bgm.mp3' 
        loop 
        preload="auto"
      />
      
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
