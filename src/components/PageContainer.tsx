import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import HomePage from '@/pages/HomePage'
import DigitalLibraryPage from '@/pages/DigitalLibrary'
import WalletPage from '@/pages/WalletPage'
import DashboardPage from '@/pages/DashboardPage'

type CurrentPage = 'dashboard' | 'home' | 'library' | 'wallet'

interface TouchInfo {
  startY: number
  startTime: number
  currentY: number
}

interface PageContainerProps {
  onRecordingStateChange?: (isRecording: boolean) => void
}

const PageContainer = ({ onRecordingStateChange }: PageContainerProps) => {
  const [currentPage, setCurrentPage] = useState<CurrentPage>('home')
  const [animationProgress, setAnimationProgress] = useState(0) // -1到2, -1是dashboard，0是home，1是library，2是wallet
  const [isAnimating, setIsAnimating] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const touchInfoRef = useRef<TouchInfo | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const rafRef = useRef<number | undefined>(undefined) // 用于节流的RAF引用
  const wheelAccumulatorRef = useRef<number>(0) // 滚轮累积值
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null) // 滚轮重置定时器

  // 手势检测配置
  const SWIPE_THRESHOLD = 50 // 最小滑动距离
  const VELOCITY_THRESHOLD = 0.3 // 最小滑动速度
  const ANIMATION_DURATION = 600 // 动画持续时间(ms)
  const WHEEL_THRESHOLD = 100 // 滚轮累积阈值
  const WHEEL_RESET_DELAY = 150 // 滚轮累积重置延迟(ms)

  // 检测WalletPage滚动状态的辅助函数
  const checkWalletScrollBoundary = useCallback((target: Element, deltaY: number) => {
    const walletScrollContainer = (target as Element).closest('[data-wallet-scroll]')
    if (!walletScrollContainer) return true // 不在WalletPage滚动区域内，允许页面切换

    const scrollTop = walletScrollContainer.scrollTop
    const scrollHeight = walletScrollContainer.scrollHeight
    const clientHeight = walletScrollContainer.clientHeight
    const maxScroll = scrollHeight - clientHeight

    // 如果内容不需要滚动，允许页面切换
    if (maxScroll <= 0) return true

    // 向上滚动且已到顶部，允许页面切换
    if (deltaY < 0 && scrollTop <= 1) return true

    // 向下滚动且已到底部，允许页面切换
    if (deltaY > 0 && scrollTop >= maxScroll - 1) return true

    // 其他情况不允许页面切换，让WalletPage内部滚动
    return false
  }, [])

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
        if (targetProgress >= 1.5) {
          setCurrentPage('wallet')
        } else if (targetProgress >= 0.5) {
          setCurrentPage('library')
        } else if (targetProgress >= -0.5) {
          setCurrentPage('home')
        } else {
          setCurrentPage('dashboard')
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [animationProgress])

  // 原生触摸开始处理函数
  const handleNativeTouchStart = useCallback((e: TouchEvent) => {
    // 检查是否点击在麦克风按钮区域
    if ((e.target as Element).closest('[data-microphone-button]')) {
      return // 直接返回，不处理页面切换
    }

    // 检查是否点击在横向滚动区域
    if ((e.target as Element).closest('[data-horizontal-scroll]')) {
      return // 直接返回，不处理页面切换，让横向滚动正常工作
    }

    if (isAnimating) return

    const touch = e.touches[0]
    touchInfoRef.current = {
      startY: touch.clientY,
      startTime: Date.now(),
      currentY: touch.clientY
    }
  }, [isAnimating])

  // 使用RAF节流的更新进度函数
  const updateProgress = useCallback((progress: number) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    
    rafRef.current = requestAnimationFrame(() => {
      setAnimationProgress(progress)
      rafRef.current = undefined
    })
  }, [])

  // 原生触摸移动处理函数
  const handleNativeTouchMove = useCallback((e: TouchEvent) => {
    if (!touchInfoRef.current || isAnimating) return

    const touch = e.touches[0]
    touchInfoRef.current.currentY = touch.clientY
    
    const deltaY = touchInfoRef.current.startY - touch.clientY

    // 检查WalletPage滚动边界
    if (!checkWalletScrollBoundary(e.target as Element, deltaY)) {
      return // 不在边界，让WalletPage内部滚动
    }

    const maxDelta = window.innerHeight * 0.3 // 最大拖拽距离为屏幕高度的30%
    
    // 计算实时进度
    let progress = deltaY / maxDelta
    
    // 限制拖拽范围
    if (currentPage === 'dashboard') {
      progress = Math.max(-1, Math.min(0, -1 + progress)) // dashboard页面上滑时progress从-1增加到0
    } else if (currentPage === 'home') {
      progress = Math.max(-1, Math.min(1, progress)) // home页面可以上滑到library或下滑到dashboard
    } else if (currentPage === 'library') {
      progress = Math.max(0, Math.min(2, 1 + progress)) // library页面可以上滑到wallet或下滑到home
    } else if (currentPage === 'wallet') {
      progress = Math.max(1, Math.min(2, 2 + progress)) // wallet页面下滑时progress从2减少到1
    }
    
    // 使用RAF节流的更新
    updateProgress(progress)

    // 防止页面滚动
    e.preventDefault()
  }, [isAnimating, currentPage, updateProgress, checkWalletScrollBoundary])

  // 原生触摸结束处理函数
  const handleNativeTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchInfoRef.current || isAnimating) return

    const { startY, startTime, currentY } = touchInfoRef.current
    const deltaY = startY - currentY
    const deltaTime = Date.now() - startTime
    const velocity = Math.abs(deltaY) / deltaTime

    // 检查WalletPage滚动边界
    if (!checkWalletScrollBoundary(e.target as Element, deltaY)) {
      touchInfoRef.current = null
      return // 不在边界，让WalletPage内部滚动
    }

    // 判断是否触发页面切换
    const shouldSwitch = Math.abs(deltaY) > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD

    if (currentPage === 'dashboard' && deltaY > 0 && shouldSwitch) {
      // 上滑切换到home
      setCurrentPage('home')
      startAnimation(0)
    } else if (currentPage === 'home' && deltaY > 0 && shouldSwitch) {
      // 上滑切换到library
      setCurrentPage('library')
      startAnimation(1)
    } else if (currentPage === 'home' && deltaY < 0 && shouldSwitch) {
      // 下滑切换到dashboard
      setCurrentPage('dashboard')
      startAnimation(-1)
    } else if (currentPage === 'library' && deltaY > 0 && shouldSwitch) {
      // 上滑切换到wallet
      setCurrentPage('wallet')
      startAnimation(2)
    } else if (currentPage === 'library' && deltaY < 0 && shouldSwitch) {
      // 下滑切换到home
      setCurrentPage('home')
      startAnimation(0)
    } else if (currentPage === 'wallet' && deltaY < 0 && shouldSwitch) {
      // 下滑切换到library
      setCurrentPage('library')
      startAnimation(1)
    } else {
      // 回弹到当前页面
      const targetProgress = currentPage === 'dashboard' ? -1 : currentPage === 'home' ? 0 : currentPage === 'library' ? 1 : 2
      startAnimation(targetProgress, ANIMATION_DURATION / 2)
    }

    touchInfoRef.current = null
  }, [isAnimating, currentPage, startAnimation, checkWalletScrollBoundary])

  // 鼠标滚轮处理函数
  const handleWheel = useCallback((e: WheelEvent) => {
    // 检查是否点击在麦克风按钮区域
    if ((e.target as Element).closest('[data-microphone-button]')) {
      return // 直接返回，不处理页面切换
    }

    // 检查是否点击在横向滚动区域
    if ((e.target as Element).closest('[data-horizontal-scroll]')) {
      return // 直接返回，不处理页面切换，让横向滚动正常工作
    }

    if (isAnimating) return

    // 检查WalletPage滚动边界
    if (!checkWalletScrollBoundary(e.target as Element, e.deltaY)) {
      return // 不在边界，让WalletPage内部滚动
    }

    // 防止默认滚动行为
    e.preventDefault()

    // 累积滚轮值
    wheelAccumulatorRef.current += e.deltaY

    // 清除之前的重置定时器
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current)
    }

    // 检查是否达到阈值
    const absAccumulator = Math.abs(wheelAccumulatorRef.current)
    if (absAccumulator >= WHEEL_THRESHOLD) {
      const isScrollingDown = wheelAccumulatorRef.current > 0

      // 根据当前页面和滚动方向决定切换
      if (isScrollingDown) {
        // 向下滚轮：dashboard → home → library → wallet
        if (currentPage === 'dashboard') {
          setCurrentPage('home')
          startAnimation(0)
        } else if (currentPage === 'home') {
          setCurrentPage('library')
          startAnimation(1)
        } else if (currentPage === 'library') {
          setCurrentPage('wallet')
          startAnimation(2)
        }
      } else {
        // 向上滚轮：wallet → library → home → dashboard
        if (currentPage === 'wallet') {
          setCurrentPage('library')
          startAnimation(1)
        } else if (currentPage === 'library') {
          setCurrentPage('home')
          startAnimation(0)
        } else if (currentPage === 'home') {
          setCurrentPage('dashboard')
          startAnimation(-1)
        }
      }

      // 重置累积值
      wheelAccumulatorRef.current = 0
    } else {
      // 设置重置定时器
      wheelTimeoutRef.current = setTimeout(() => {
        wheelAccumulatorRef.current = 0
      }, WHEEL_RESET_DELAY)
    }
  }, [isAnimating, currentPage, startAnimation, checkWalletScrollBoundary])

  // 设置触摸事件和滚轮事件监听器
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 添加非被动触摸事件监听器
    container.addEventListener('touchstart', handleNativeTouchStart, { passive: false })
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false })
    container.addEventListener('touchend', handleNativeTouchEnd, { passive: false })
    
    // 添加滚轮事件监听器
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleNativeTouchStart)
      container.removeEventListener('touchmove', handleNativeTouchMove)
      container.removeEventListener('touchend', handleNativeTouchEnd)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [handleNativeTouchStart, handleNativeTouchMove, handleNativeTouchEnd, handleWheel])

  // 清理动画帧、RAF节流和滚轮定时器
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current)
      }
    }
  }, [])

  // 使用useMemo缓存样式计算
  const dashboardStyle = useMemo(() => {
    const progress = animationProgress
    const translateY = (-1 - progress) * 100 // Dashboard在Home下方
    const translateZ = (-1 - progress) * -200
    const rotateX = (-1 - progress) * 25
    // 保持scale效果，用于外部滚动和触控监听
    const scale = 0.85 + (progress + 1) * 0.15
    // 修正opacity计算：当progress为-1时，opacity应该为1
    const opacity = Math.abs(progress + 1) < 0.001 ? 1 : (progress + 1) * 0.9 + 0.1
    
    // 简化阴影计算
    const shadowOpacity = Math.abs(progress + 1) < 0.001 ? 0.3 : (progress + 1) * 0.4
    const shadowBlur = 30 + (-1 - progress) * 10
    const shadowOffset = (-1 - progress) * 8
    
    // 计算圆角 - 当progress为-1时无圆角，非-1时有固定圆角
    // const isInteger = Math.abs(progress - Math.round(progress)) < 0.001
    // const borderRadius = isInteger ? '0' : '0.75rem' // 0或rounded-xl (0.75rem)
    
    return {
      transform: `translate3d(0, ${translateY}%, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
      opacity: Math.max(0, opacity),
      zIndex: progress > -0.5 ? 1 : 2,
      boxShadow: `0 ${shadowOffset}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`,
      filter: `brightness(${Math.abs(progress + 1) < 0.001 ? 1 : 0.8 + (progress + 1) * 0.2})`,
      backfaceVisibility: 'hidden' as const,
    }
  }, [animationProgress])

  const homeStyle = useMemo(() => {
    const progress = animationProgress
    const translateY = progress * -100
    const translateZ = progress * 150
    const rotateX = progress * -20
    const scale = 1 - progress * 0.15
    const opacity = 1 - progress * 0.4
    
    // 简化阴影计算
    const shadowOpacity = (1 - progress) * 0.3 + progress * 0.5
    const shadowBlur = 20 + progress * 20
    const shadowOffset = progress * 10
    
    // 计算圆角 - 当progress为0时无圆角，非0时有固定圆角
    const isInteger = Math.abs(progress - Math.round(progress)) < 0.001
    const borderRadius = isInteger ? '0' : '0.75rem' // 0或rounded-xl (0.75rem)
    
    return {
      transform: `translate3d(0, ${translateY}%, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
      opacity,
      zIndex: progress < 0.5 ? 2 : 1,
      boxShadow: `0 ${shadowOffset}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`,
      filter: `brightness(${1 - progress * 0.1})`,
      backfaceVisibility: 'hidden' as const,
      borderRadius: borderRadius
    }
  }, [animationProgress])

  const libraryStyle = useMemo(() => {
    const progress = animationProgress
    const translateY = (1 - progress) * 100
    const translateZ = (1 - progress) * -200
    const rotateX = (1 - progress) * 25
    const scale = 0.85 + progress * 0.15
    const opacity = progress * 0.9 + 0.1
    
    // 简化阴影计算
    const shadowOpacity = progress * 0.4
    const shadowBlur = 30 + (1 - progress) * 10
    const shadowOffset = (1 - progress) * 8
    
    // 计算圆角 - 当progress为1时无圆角，非1时有固定圆角
    const isInteger = Math.abs(progress - Math.round(progress)) < 0.001
    const borderRadius = isInteger ? '0' : '0.75rem' // 0或rounded-xl (0.75rem)
    
    return {
      transform: `translate3d(0, ${translateY}%, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
      opacity,
      zIndex: progress > 0.5 && progress < 1.5 ? 2 : 1,
      boxShadow: `0 ${shadowOffset}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`,
      filter: `brightness(${0.8 + progress * 0.2})`,
      backfaceVisibility: 'hidden' as const,
      borderRadius: borderRadius
    }
  }, [animationProgress])

  const walletStyle = useMemo(() => {
    const progress = animationProgress
    const translateY = (2 - progress) * 100
    const translateZ = (2 - progress) * -300
    const rotateX = (2 - progress) * 30
    const scale = 0.8 + (progress - 1) * 0.2
    const opacity = (progress - 1) * 0.9 + 0.1
    
    // 简化阴影计算
    const shadowOpacity = (progress - 1) * 0.5
    const shadowBlur = 40 + (2 - progress) * 15
    const shadowOffset = (2 - progress) * 12
    
    // 计算圆角 - 当progress为2时无圆角，非2时有固定圆角
    const isInteger = Math.abs(progress - Math.round(progress)) < 0.001
    const borderRadius = isInteger ? '0' : '0.75rem' // 0或rounded-xl (0.75rem)
    
    return {
      transform: `translate3d(0, ${translateY}%, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
      opacity: Math.max(0, opacity),
      zIndex: progress > 1.5 ? 2 : 1,
      boxShadow: `0 ${shadowOffset}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity})`,
      filter: `brightness(${0.7 + (progress - 1) * 0.3})`,
      backfaceVisibility: 'hidden' as const,
      borderRadius: borderRadius
    }
  }, [animationProgress])

  // 环境背景样式缓存
  const backgroundStyle = useMemo(() => ({
    transform: `translateZ(-500px) scale(1.25)`,
    opacity: animationProgress * 0.3
  }), [animationProgress])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{ 
        perspective: '2000px', // 增加perspective距离，获得更强的3D效果
        perspectiveOrigin: '50% 50%' // 设置透视原点
      }}
    >
      {/* 3D环境背景 */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-gray-200/40 pointer-events-none"
        style={backgroundStyle}
      />
      
      {/* Dashboard页面 */}
      <div
        className="absolute inset-0 will-change-transform overflow-hidden rounded-xl"
        style={{
          ...dashboardStyle,
          transition: isAnimating ? 'none' : 'all 0.3s ease-out',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 页面厚度效果 - 顶面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-blue-300/10 to-transparent pointer-events-none"
          style={{
            transform: 'translateZ(8px)',
            borderRadius: 'inherit'
          }}
        />
        {/* 页面厚度效果 - 侧面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-blue-800/20 pointer-events-none"
          style={{
            transform: 'rotateX(90deg) translateZ(4px)',
            transformOrigin: 'bottom',
            height: '8px',
            bottom: 0
          }}
        />
        
        <div className="relative w-full h-full overflow-hidden border border-blue-400/20"
             style={{ borderRadius: 'inherit' }}>
          <DashboardPage />
        </div>
        
        {/* Dashboard页面遮罩，增强层次感 */}
        {animationProgress < 0 && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ 
              opacity: (1 + animationProgress) * 0.3,
              zIndex: -1,
              borderRadius: 'inherit'
            }}
          />
        )}
      </div>

      {/* Home页面 */}
      <div
        className="absolute inset-0 will-change-transform overflow-hidden"
        style={{
          ...homeStyle,
          transition: isAnimating ? 'none' : 'all 0.3s ease-out',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 页面厚度效果 - 顶面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"
          style={{
            transform: 'translateZ(8px)',
            borderRadius: 'inherit'
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
        
        <div className="relative w-full h-full bg-black overflow-hidden border border-white/10"
             style={{ borderRadius: 'inherit' }}>
          <HomePage onRecordingStateChange={onRecordingStateChange} />
        </div>
      </div>

      {/* Library页面 */}
      <div
        className="absolute inset-0 will-change-transform overflow-hidden"
        style={{
          ...libraryStyle,
          transition: isAnimating ? 'none' : 'all 0.3s ease-out',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 页面厚度效果 - 顶面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-purple-300/10 to-transparent pointer-events-none"
          style={{
            transform: 'translateZ(8px)',
            borderRadius: 'inherit'
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
        
        <div className="relative w-full h-full overflow-hidden"
             style={{ borderRadius: 'inherit' }}>
          <DigitalLibraryPage />
        </div>
        
        {/* Library页面遮罩，增强层次感 */}
        {animationProgress > 0 && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ 
              opacity: (1 - animationProgress) * 0.3,
              zIndex: -1,
              borderRadius: 'inherit'
            }}
          />
        )}
      </div>

      {/* Wallet页面 */}
      <div
        className="absolute inset-0 will-change-transform overflow-hidden"
        style={{
          ...walletStyle,
          transition: isAnimating ? 'none' : 'all 0.3s ease-out',
          transformStyle: 'preserve-3d'
        }}
      >
        {/* 页面厚度效果 - 顶面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-green-300/10 to-transparent pointer-events-none"
          style={{
            transform: 'translateZ(8px)',
            borderRadius: 'inherit'
          }}
        />
        {/* 页面厚度效果 - 侧面 */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-green-900/30 to-green-800/20 pointer-events-none"
          style={{
            transform: 'rotateX(90deg) translateZ(4px)',
            transformOrigin: 'bottom',
            height: '8px',
            bottom: 0
          }}
        />
        
        <div className="relative w-full h-full bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 overflow-hidden border border-green-400/20"
             style={{ borderRadius: 'inherit' }}>
          <WalletPage />
        </div>
        
        {/* Wallet页面遮罩，增强层次感 */}
        {animationProgress > 1 && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ 
              opacity: (1 - animationProgress) * 0.3,
              zIndex: -1,
              borderRadius: 'inherit'
            }}
          />
        )}
      </div>

      {/* 页面指示器 - 极简设计 */}
      <div 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col space-y-2 z-50 transition-opacity duration-300"
        style={{ 
          opacity: (animationProgress === -1 || animationProgress === 0 || animationProgress === 1 || animationProgress === 2) ? 1 : 0 
        }}
      >
        <div 
          className={`w-1 h-1 rounded-full transition-all duration-500 ${
            currentPage === 'dashboard' 
              ? 'bg-white/80' 
              : 'bg-white/20'
          }`} 
        />
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
        <div 
          className={`w-1 h-1 rounded-full transition-all duration-500 ${
            currentPage === 'wallet' 
              ? 'bg-white/80' 
              : 'bg-white/20'
          }`} 
        />
      </div>
    </div>
  )
}

export default PageContainer
