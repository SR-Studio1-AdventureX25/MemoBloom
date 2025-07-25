import { useState, useRef, useCallback, useEffect } from 'react'
import HomePage from '@/pages/HomePage'
import DigitalLibraryPage from '@/pages/DigitalLibrary'

type CurrentPage = 'home' | 'library'

interface TouchInfo {
  startY: number
  startTime: number
  currentY: number
}

const PageContainer = () => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home')
  const [animationProgress, setAnimationProgress] = useState(0) // 0-1, 0是home完全显示，1是library完全显示
  const [isAnimating, setIsAnimating] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const touchInfoRef = useRef<TouchInfo | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  // 手势检测配置
  const SWIPE_THRESHOLD = 50 // 最小滑动距离
  const VELOCITY_THRESHOLD = 0.3 // 最小滑动速度
  const ANIMATION_DURATION = 600 // 动画持续时间(ms)

  // 开始动画
  const startAnimation = useCallback((targetProgress: number, duration: number = ANIMATION_DURATION) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    setIsAnimating(true)
    
    // 获取当前进度
    const startProgress = animationProgress
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // 使用easeOutCubic缓动函数
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentProgressValue = startProgress + (targetProgress - startProgress) * easeProgress
      
      setAnimationProgress(currentProgressValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setCurrentPage(targetProgress >= 0.5 ? 'library' : 'home')
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [animationProgress])

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return

    const touch = e.touches[0]
    touchInfoRef.current = {
      startY: touch.clientY,
      startTime: Date.now(),
      currentY: touch.clientY
    }
  }, [isAnimating])

  // 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchInfoRef.current || isAnimating) return

    const touch = e.touches[0]
    touchInfoRef.current.currentY = touch.clientY
    
    const deltaY = touchInfoRef.current.startY - touch.clientY
    const maxDelta = window.innerHeight * 0.3 // 最大拖拽距离为屏幕高度的30%
    
    // 计算实时进度
    let progress = deltaY / maxDelta
    
    // 限制拖拽范围
    if (currentPage === 'home') {
      progress = Math.max(0, Math.min(1, progress))
    } else {
      progress = Math.max(0, Math.min(1, 1 + progress)) // library页面下滑时progress从1减少到0
    }
    
    setAnimationProgress(progress)

    // 防止页面滚动
    e.preventDefault()
  }, [isAnimating, currentPage])

  // 触摸结束
  const handleTouchEnd = useCallback(() => {
    if (!touchInfoRef.current || isAnimating) return

    const { startY, startTime, currentY } = touchInfoRef.current
    const deltaY = startY - currentY
    const deltaTime = Date.now() - startTime
    const velocity = Math.abs(deltaY) / deltaTime

    // 判断是否触发页面切换
    const shouldSwitch = Math.abs(deltaY) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD

    if (currentPage === 'home' && deltaY > 0 && shouldSwitch) {
      // 上滑切换到library
      setCurrentPage('library')
      startAnimation(1)
    } else if (currentPage === 'library' && deltaY < 0 && shouldSwitch) {
      // 下滑切换到home
      setCurrentPage('home')
      startAnimation(0)
    } else {
      // 回弹到当前页面
      const targetProgress = currentPage === 'home' ? 0 : 1
      startAnimation(targetProgress, ANIMATION_DURATION / 2)
    }

    touchInfoRef.current = null
  }, [isAnimating, currentPage, startAnimation])

  // 清理动画帧
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // 计算3D变换样式
  const getTransformStyle = (isLibrary: boolean) => {
    const progress = animationProgress
    
    if (isLibrary) {
      // Library页面：从下方移入
      const translateY = (1 - progress) * 100
      const translateZ = (1 - progress) * -200 // 增加Z轴深度
      const rotateX = (1 - progress) * 25 // 增加旋转角度
      const scale = 0.85 + progress * 0.15 // 更明显的缩放效果
      const opacity = progress * 0.9 + 0.1
      
      // 计算阴影强度
      const shadowOpacity = progress * 0.6
      const shadowBlur = 30 + (1 - progress) * 20
      const shadowOffset = (1 - progress) * 10
      
      return {
        transform: `translateY(${translateY}%) translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
        opacity,
        zIndex: progress > 0.5 ? 2 : 1,
        boxShadow: `0 ${shadowOffset}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity}), 
                   0 ${shadowOffset * 2}px ${shadowBlur * 2}px rgba(0, 0, 0, ${shadowOpacity * 0.3})`,
        filter: `brightness(${0.7 + progress * 0.3})` // 环境光影效果
      }
    } else {
      // Home页面：向上移出
      const translateY = progress * -100
      const translateZ = progress * 150 // Z轴向前移动
      const rotateX = progress * -20 // 增加旋转角度
      const scale = 1 - progress * 0.15 // 更明显的缩小效果
      const opacity = 1 - progress * 0.4
      
      // 计算阴影强度
      const shadowOpacity = (1 - progress) * 0.4 + progress * 0.8
      const shadowBlur = 20 + progress * 40
      const shadowOffset = progress * 15
      
      return {
        transform: `translateY(${translateY}%) translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
        opacity,
        zIndex: progress < 0.5 ? 2 : 1,
        boxShadow: `0 ${shadowOffset}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity}), 
                   0 ${shadowOffset * 1.5}px ${shadowBlur * 1.5}px rgba(0, 0, 0, ${shadowOpacity * 0.4})`,
        filter: `brightness(${1 - progress * 0.2})` // 环境光影效果
      }
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{ 
        perspective: '2000px', // 增加perspective距离，获得更强的3D效果
        perspectiveOrigin: '50% 50%' // 设置透视原点
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D环境背景 */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-gray-200/40 pointer-events-none"
        style={{
          transform: `translateZ(-500px) scale(1.25)`,
          opacity: animationProgress * 0.3
        }}
      />
      {/* Home页面 */}
      <div
        className="absolute inset-0 will-change-transform rounded-xl overflow-hidden"
        style={{
          ...getTransformStyle(false),
          transition: isAnimating ? 'none' : 'all 0.3s ease-out',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 页面厚度效果 - 顶面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"
          style={{
            transform: 'translateZ(8px)',
            borderRadius: '12px'
          }}
        />
        {/* 页面厚度效果 - 侧面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/10 pointer-events-none"
          style={{
            transform: 'rotateX(90deg) translateZ(4px)',
            transformOrigin: 'bottom',
            height: '8px',
            bottom: 0
          }}
        />
        
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden border border-white/10">
          <HomePage />
        </div>
      </div>

      {/* Library页面 */}
      <div
        className="absolute inset-0 will-change-transform rounded-xl overflow-hidden"
        style={{
          ...getTransformStyle(true),
          transition: isAnimating ? 'none' : 'all 0.3s ease-out',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 页面厚度效果 - 顶面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-purple-300/10 to-transparent pointer-events-none"
          style={{
            transform: 'translateZ(8px)',
            borderRadius: '12px'
          }}
        />
        {/* 页面厚度效果 - 侧面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-purple-800/20 pointer-events-none"
          style={{
            transform: 'rotateX(90deg) translateZ(4px)',
            transformOrigin: 'bottom',
            height: '8px',
            bottom: 0
          }}
        />
        
        <div className="relative w-full h-full bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl overflow-hidden border border-purple-400/20">
          <DigitalLibraryPage />
        </div>
        
        {/* Library页面遮罩，增强层次感 */}
        {animationProgress > 0 && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none rounded-xl"
            style={{ 
              opacity: (1 - animationProgress) * 0.3,
              zIndex: -1 
            }}
          />
        )}
      </div>

      {/* 页面指示器 - 极简设计 */}
      <div 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-50 transition-opacity duration-300"
        style={{ 
          opacity: (animationProgress === 0 || animationProgress === 1) ? 1 : 0 
        }}
      >
        <div 
          className={`w-1 h-1 rounded-full transition-all duration-500 ${
            currentPage === 'home' 
              ? 'bg-white/80' 
              : 'bg-white/20'
          }`} 
        />
        <div 
          className={`w-1 h-1 rounded-full transition-all duration-500 ${
            currentPage === 'library' 
              ? 'bg-white/80' 
              : 'bg-white/20'
          }`} 
        />
      </div>
    </div>
  )
}

export default PageContainer
