import { useCallback, useEffect, useState } from 'react'
import { useAppStore } from '@/store'

interface LoadingProgressProps {
  onComplete?: () => void
  // Sigmoid 函数参数
  simulationSpeed?: number // 模拟速度系数，默认 1.0
  steepness?: number // 曲线陡峭程度，默认 6
  midpoint?: number // 中点位置（0-1），默认 0.5
}

export default function LoadingProgress({ 
  onComplete,
  simulationSpeed = 1.0,
  steepness = 6,
  midpoint = 0.5
}: LoadingProgressProps) {
  const { resourceCache } = useAppStore()
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // Sigmoid 函数：生成 S 型曲线
  const sigmoidTransform = useCallback((progress: number): number => {
    if (progress <= 0) return 0
    if (progress >= 100) return 100
    
    // 将进度 (0-100) 映射到 (0-1)
    const t = progress / 100
    
    // 应用 Sigmoid 变换
    const x = (t - midpoint) * steepness
    const sigmoid = 1 / (1 + Math.exp(-x))
    
    // 标准化到 0-100 范围
    const minValue = 1 / (1 + Math.exp(midpoint * steepness))
    const maxValue = 1 / (1 + Math.exp((midpoint - 1) * steepness))
    
    const normalized = (sigmoid - minValue) / (maxValue - minValue)
    return Math.max(0, Math.min(100, normalized * 100))
  }, [steepness, midpoint])

  // 使用 Sigmoid 函数平滑显示进度
  useEffect(() => {
    const targetProgress = resourceCache.progress
    const currentProgress = displayProgress
    
    if (Math.abs(targetProgress - currentProgress) > 0.1) {
      // 使用 Sigmoid 变换让进度更平滑
      const sigmoidTarget = sigmoidTransform(targetProgress)
      const sigmoidCurrent = sigmoidTransform(currentProgress)
      
      // 计算增量，让动画更平滑
      const diff = sigmoidTarget - sigmoidCurrent
      const increment = diff * 0.1 * simulationSpeed // 调整平滑速度
      
      const timer = setTimeout(() => {
        setDisplayProgress(prev => {
          const newProgress = prev + increment
          return Math.max(0, Math.min(100, newProgress))
        })
      }, 16) // 约60fps
      
      return () => clearTimeout(timer)
    }
  }, [resourceCache.progress, displayProgress, simulationSpeed, sigmoidTransform])

  // 检查完成状态
  useEffect(() => {
    if (resourceCache.isLoaded && displayProgress >= 100 && !isComplete) {
      setIsComplete(true)
      const timer = setTimeout(() => {
        onComplete?.()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [resourceCache.isLoaded, displayProgress, isComplete, onComplete])

  if (isComplete && displayProgress >= 100) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* 背景动画 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20">
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-12 max-w-md w-full mx-auto">
        {/* Logo 或图标 */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          MemoBloom
        </h1>
        
        {/* 副标题 */}
        <p className="text-gray-300 text-center mb-8">
          正在加载游戏资源...
        </p>

        {/* 进度条容器 */}
        <div className="w-full">
          {/* 进度条背景 */}
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
            {/* 进度条 */}
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${displayProgress}%` }}
            >
              {/* 光晕效果 */}
              <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>

          {/* 进度文本 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">
              {resourceCache.error ? '加载出错' : '加载中'}
            </span>
            <span className="text-white font-mono">
              {Math.round(displayProgress)}%
            </span>
          </div>

          {/* 错误信息 */}
          {resourceCache.error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm text-center">
                {resourceCache.error}
              </p>
            </div>
          )}
        </div>

        {/* 加载提示 */}
        <div className="mt-8 flex items-center justify-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
          <span className="ml-3 text-gray-400 text-sm">
            请耐心等待
          </span>
        </div>

        {/* 小贴士 */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            首次启动需要下载游戏资源
          </p>
          <p className="text-gray-500 text-xs mt-1">
            后续启动将会更快
          </p>
        </div>
      </div>

      {/* 装饰性背景元素 */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-400/10 rounded-full blur-xl" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-400/10 rounded-full blur-xl" />
      <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-purple-400/10 rounded-full blur-xl" />
    </div>
  )
}
