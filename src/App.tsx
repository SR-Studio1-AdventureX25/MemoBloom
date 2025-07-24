import { useEffect, useState } from 'react'
import { useAppStore } from '@/store'
import { pwaService } from '@/services/pwa'
import { resourceCacheService } from '@/services/resourceCache'
import LoadingProgress from '@/components/LoadingProgress'
import HomePage from '@/components/HomePage'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'

function App() {
  const { resourceCache } = useAppStore()
  const [isAppReady, setIsAppReady] = useState(false)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // 初始化PWA服务
      await pwaService.init()
      
      // 初始化资源缓存服务
      await resourceCacheService.init()
      
      // 检查是否需要缓存资源
      const allResourcesCached = await resourceCacheService.areAllResourcesCached()
      
      if (!allResourcesCached) {
        // 开始缓存资源
        await resourceCacheService.cacheAllResources()
      } else {
        // 资源已缓存，直接完成
        const { setResourceCache } = useAppStore.getState()
        setResourceCache({ isLoaded: true, progress: 100 })
      }
      
    } catch (error) {
      console.error('应用初始化失败:', error)
      // 即使初始化失败，也要让应用可以运行
      const { setResourceCache } = useAppStore.getState()
      setResourceCache({ 
        isLoaded: true, // 标记为已加载，让应用继续
        progress: 100, 
        error: '资源加载失败，使用离线模式' 
      })
    }
    
    // 无论成功失败，都在3秒后强制进入应用
    setTimeout(() => {
      setIsAppReady(true)
    }, 3000)
  }

  // 处理加载完成
  const handleLoadingComplete = () => {
    setIsAppReady(true)
  }

  // 如果资源还没加载完成且应用还没准备好，显示加载界面
  if (!resourceCache.isLoaded && !isAppReady) {
    return <LoadingProgress onComplete={handleLoadingComplete} />
  }

  return (
    <>
      <HomePage />
      {/* PWA安装提示 */}
      <PWAInstallPrompt />
      {/* PWA更新提示 */}
      <PWAUpdatePrompt />
    </>
  )
}

export default App
