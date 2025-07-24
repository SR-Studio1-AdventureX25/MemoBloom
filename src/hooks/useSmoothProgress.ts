import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAnimationFrame } from './useAnimationFrame'

interface SmoothProgressOptions {
  simulationSpeed?: number // 模拟速度系数，默认 1.0
  steepness?: number // 曲线陡峭程度，默认 6
  midpoint?: number // 中点位置（0-1），默认 0.5
}

/**
 * 平滑进度动画 hook
 * 使用 Sigmoid 函数创建 S 型进度曲线
 */
export const useSmoothProgress = (
  targetProgress: number, 
  options: SmoothProgressOptions = {}
) => {
  const { simulationSpeed = 1.0, steepness = 6, midpoint = 0.5 } = options
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // 使用 useMemo 缓存 Sigmoid 变换函数
  const sigmoidTransform = useMemo(() => {
    // 预计算常量值以提高性能
    const minValue = 1 / (1 + Math.exp(midpoint * steepness))
    const maxValue = 1 / (1 + Math.exp((midpoint - 1) * steepness))
    const range = maxValue - minValue

    return (progress: number): number => {
      if (progress <= 0) return 0
      if (progress >= 100) return 100
      
      // 将进度 (0-100) 映射到 (0-1)
      const t = progress / 100
      
      // 应用 Sigmoid 变换
      const x = (t - midpoint) * steepness
      const sigmoid = 1 / (1 + Math.exp(-x))
      
      // 标准化到 0-100 范围
      const normalized = (sigmoid - minValue) / range
      return Math.max(0, Math.min(100, normalized * 100))
    }
  }, [steepness, midpoint])

  // 动画回调函数
  const animateProgress = useCallback((deltaTime: number) => {
    setDisplayProgress(current => {
      const sigmoidTarget = sigmoidTransform(targetProgress)
      const sigmoidCurrent = sigmoidTransform(current)
      
      const diff = sigmoidTarget - sigmoidCurrent
      
      // 如果差值很小，直接设置为目标值并停止动画
      if (Math.abs(diff) < 0.1) {
        setIsAnimating(false)
        return targetProgress
      }
      
      // 基于时间的平滑插值
      const smoothingFactor = Math.min(deltaTime / 1000 * simulationSpeed * 5, 1)
      const increment = diff * smoothingFactor
      
      return Math.max(0, Math.min(100, current + increment))
    })
  }, [targetProgress, simulationSpeed, sigmoidTransform])

  // 使用优化的动画 hook
  const { stop } = useAnimationFrame(isAnimating ? animateProgress : () => {})

  // 监听目标进度变化，启动动画
  useEffect(() => {
    if (Math.abs(targetProgress - displayProgress) > 0.1) {
      setIsAnimating(true)
    }
  }, [targetProgress, displayProgress])

  // 清理动画
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    displayProgress: Math.round(displayProgress * 10) / 10, // 保留一位小数
    isAnimating
  }
}
