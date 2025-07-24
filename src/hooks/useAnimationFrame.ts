import { useCallback, useEffect, useRef } from 'react'

/**
 * 使用 requestAnimationFrame 的自定义 hook
 * 提供更好的动画性能
 */
export const useAnimationFrame = (callback: (deltaTime: number) => void) => {
  const requestRef = useRef<number | undefined>(undefined)
  const previousTimeRef = useRef<number | undefined>(undefined)
  const callbackRef = useRef(callback)

  // 更新回调引用
  callbackRef.current = callback

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current
      callbackRef.current(deltaTime)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [animate])

  // 提供手动停止动画的方法
  const stop = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
    }
  }, [])

  return { stop }
}
