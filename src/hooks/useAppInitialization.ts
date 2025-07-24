import { useEffect, useState, useRef, useCallback } from 'react'
import { useAppStore } from '@/store'
import { pwaService } from '@/services/pwa'
import { resourceCacheService } from '@/services/resourceCache'

// 配置常量
const APP_CONFIG = {
  FORCE_READY_TIMEOUT: 10000, // 10秒后强制进入应用
  COMPLETION_DELAY: 500 // 完成后延迟时间
} as const

interface AppInitializationState {
  isAppReady: boolean
  initError: string | null
}

/**
 * 应用初始化 hook
 * 处理 PWA 和资源缓存的初始化逻辑
 */
export const useAppInitialization = () => {
  const { resourceCache, setResourceCache } = useAppStore()
  const [state, setState] = useState<AppInitializationState>({
    isAppReady: false,
    initError: null
  })
  
  // 使用 ref 防止重复初始化
  const hasInitialized = useRef(false)
  const forceReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setAppReady = () => {
    // 清除强制准备超时
    if (forceReadyTimeoutRef.current) {
      clearTimeout(forceReadyTimeoutRef.current)
      forceReadyTimeoutRef.current = null
    }
    
    setTimeout(() => {
      setState(prev => ({ ...prev, isAppReady: true }))
    }, APP_CONFIG.COMPLETION_DELAY)
  }

  const handleInitError = useCallback((error: Error) => {
    console.error('应用初始化失败:', error)
    const errorMessage = '资源加载失败，使用离线模式'
    
    setState(prev => ({ ...prev, initError: errorMessage }))
    
    // 即使初始化失败，也要让应用可以运行
    setResourceCache({ 
      isLoaded: true,
      progress: 100, 
      error: errorMessage
    })
  }, [setResourceCache])

  const initializeApp = useCallback(async () => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    try {
      // 设置强制准备超时
      forceReadyTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isAppReady: true }))
      }, APP_CONFIG.FORCE_READY_TIMEOUT)

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
        setResourceCache({ isLoaded: true, progress: 100 })
      }
      
    } catch (error) {
      handleInitError(error as Error)
    }
  }, [setResourceCache, handleInitError])

  // 监听资源加载完成，自动设置应用准备状态
  useEffect(() => {
    if (resourceCache.isLoaded && resourceCache.progress >= 100 && !state.isAppReady) {
      setAppReady()
    }
  }, [resourceCache.isLoaded, resourceCache.progress, state.isAppReady])

  // 初始化应用
  useEffect(() => {
    initializeApp()
    
    // 清理函数
    return () => {
      if (forceReadyTimeoutRef.current) {
        clearTimeout(forceReadyTimeoutRef.current)
      }
    }
  }, [initializeApp]) // 移除setResourceCache依赖，因为它会导致无限循环

  return {
    isAppReady: state.isAppReady,
    initError: state.initError
  }
}
