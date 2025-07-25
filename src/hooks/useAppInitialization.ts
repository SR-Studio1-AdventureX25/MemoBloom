import { useEffect, useState, useRef, useCallback } from 'react'
import { pwaService } from '@/services/pwa'

// 配置常量
const APP_CONFIG = {
  COMPLETION_DELAY: 200 // 完成后延迟时间
} as const

interface AppInitializationState {
  isAppReady: boolean
  initError: string | null
}

/**
 * 应用初始化 hook
 * 处理 PWA 初始化逻辑
 */
export const useAppInitialization = () => {
  const [state, setState] = useState<AppInitializationState>({
    isAppReady: false,
    initError: null
  })
  
  // 使用 ref 防止重复初始化
  const hasInitialized = useRef(false)

  const setAppReady = () => {
    setTimeout(() => {
      setState(prev => ({ ...prev, isAppReady: true }))
    }, APP_CONFIG.COMPLETION_DELAY)
  }

  const handleInitError = useCallback((error: Error) => {
    console.error('应用初始化失败:', error)
    const errorMessage = '初始化失败，但应用仍可正常使用'
    
    setState(prev => ({ ...prev, initError: errorMessage }))
    
    // 即使初始化失败，也要让应用可以运行
    setAppReady()
  }, [])

  const initializeApp = useCallback(async () => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    try {
      // 初始化PWA服务
      await pwaService.init()
      
      // 应用准备就绪
      setAppReady()
      
    } catch (error) {
      handleInitError(error as Error)
    }
  }, [handleInitError])

  // 初始化应用
  useEffect(() => {
    initializeApp()
  }, [initializeApp])

  return {
    isAppReady: state.isAppReady,
    initError: state.initError
  }
}
