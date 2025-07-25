import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@/store'

export default function VideoBackground() {
  const { 
    currentPlantId, 
    plants, 
    videoPlaylist, 
    currentVideoIndex, 
    setCurrentVideoIndex, 
    updateVideoPlaylist 
  } = useAppStore()
  
  const frontVideoRef = useRef<HTMLVideoElement>(null)
  const backVideoRef = useRef<HTMLVideoElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  
  const [frontVideoUrl, setFrontVideoUrl] = useState<string | null>(null)
  const [backVideoUrl, setBackVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frontVideoActive, setFrontVideoActive] = useState(true) // 控制哪个video在前景
  const frontVideoPlayed = useRef(false) // 防止重复播放
  const backVideoPlayed = useRef(false) // 防止重复播放

  // 获取当前植物
  const currentPlant = useMemo(() => {
    return currentPlantId ? plants.find(p => p.id === currentPlantId) : null
  }, [currentPlantId, plants])

  // 获取当前要播放的资源ID
  const currentResourceId = useMemo(() => {
    return videoPlaylist[currentVideoIndex] || null
  }, [videoPlaylist, currentVideoIndex])

  // 获取下一个要播放的资源ID
  const nextResourceId = useMemo(() => {
    if (videoPlaylist.length === 0) return null
    const nextIndex = (currentVideoIndex + 1) % videoPlaylist.length
    return videoPlaylist[nextIndex]
  }, [videoPlaylist, currentVideoIndex])

  // 初始化播放列表
  const initializePlaylist = useCallback(() => {
    if (!currentPlant) return

    const stage = currentPlant.currentGrowthStage
    const normalVideoId = `plant-${stage}-normal`
    
    // 初始化为循环播放normal视频
    updateVideoPlaylist([normalVideoId, normalVideoId])
  }, [currentPlant, updateVideoPlaylist])

  // 判断当前资源是否为图片
  const isCurrentResourceImage = useMemo(() => {
    return currentResourceId?.includes('seed-normal') || false
  }, [currentResourceId])

  // 资源ID到静态文件路径的映射
  const getResourceUrl = useCallback((resourceId: string): string | null => {
    const resourceMap: Record<string, string> = {
      // 种子阶段
      'plant-seed-happy': '/plantsVideo/seed_happy.mp4',
      'plant-seed-normal': '/plantsVideo/seed_normal.png',
      'plant-seed-sad': '/plantsVideo/seed_sad.mp4',
      // 幼苗阶段
      'plant-sprout-happy': '/plantsVideo/sprout_happy.mp4',
      'plant-sprout-normal': '/plantsVideo/sprout_normal.mp4',
      'plant-sprout-sad': '/plantsVideo/sprout_sad.mp4',
      // 成熟阶段
      'plant-mature-happy': '/plantsVideo/mature_happy.mp4',
      'plant-mature-normal': '/plantsVideo/mature_normal.mp4',
      'plant-mature-sad': '/plantsVideo/mature_sad.mp4',
      // 开花阶段
      'plant-flowering-happy': '/plantsVideo/flowering_happy.mp4',
      'plant-flowering-normal': '/plantsVideo/flowering_normal.mp4',
      'plant-flowering-sad': '/plantsVideo/flowering_sad.mp4'
    }
    
    return resourceMap[resourceId] || null
  }, [])

  // 处理视频播放结束
  const handleVideoEnded = useCallback(() => {
    console.log(`视频播放完成: ${currentResourceId}`)
    
    // 切换到下一个视频
    const nextIndex = (currentVideoIndex + 1) % videoPlaylist.length
    setCurrentVideoIndex(nextIndex)
    
    // 切换前后景
    setFrontVideoActive(prev => {
      const newActive = !prev
      console.log(`切换前后景: ${prev} -> ${newActive}`)
      
      // 重置播放标志，让原来的背景视频可以播放
      setTimeout(() => {
        if (newActive) {
          // 前景变为active，重置前景播放标志
          frontVideoPlayed.current = false
          if (frontVideoRef.current) {
            console.log('重置前景视频播放标志，准备播放')
            frontVideoRef.current.currentTime = 0
            frontVideoRef.current.play().catch(error => {
              console.warn('切换后播放前景视频失败:', error)
            })
          }
        } else {
          // 背景变为active，重置背景播放标志
          backVideoPlayed.current = false
          if (backVideoRef.current) {
            console.log('重置背景视频播放标志，准备播放')
            backVideoRef.current.currentTime = 0
            backVideoRef.current.play().catch(error => {
              console.warn('切换后播放背景视频失败:', error)
            })
          }
        }
      }, 100) // 给DOM更新一点时间
      
      return newActive
    })
    
    // 如果完成了一轮播放（播放了happy/sad后回到normal）
    if (nextIndex === 0 && videoPlaylist[1] !== videoPlaylist[0]) {
      if (currentPlant) {
        const stage = currentPlant.currentGrowthStage
        const normalVideoId = `plant-${stage}-normal`
        updateVideoPlaylist([normalVideoId, normalVideoId])
        console.log(`重置播放列表为循环播放: ${normalVideoId}`)
      }
    }
  }, [currentResourceId, currentVideoIndex, videoPlaylist, setCurrentVideoIndex, updateVideoPlaylist, currentPlant])

  // 处理前景视频可以播放
  const handleFrontVideoCanPlay = useCallback(() => {
    if (frontVideoRef.current && !frontVideoPlayed.current) {
      // 动态检查前景视频是否应该播放
      const shouldPlay = frontVideoRef.current.style.zIndex === '2'
      if (shouldPlay) {
        console.log('前景视频可以播放，开始自动播放')
        frontVideoPlayed.current = true
        frontVideoRef.current.currentTime = 0
        frontVideoRef.current.play().catch((error) => {
          console.warn('前景视频自动播放被阻止:', error)
        })
      }
    }
  }, [])

  // 处理背景视频可以播放
  const handleBackVideoCanPlay = useCallback(() => {
    if (backVideoRef.current && !backVideoPlayed.current) {
      // 动态检查背景视频是否应该播放
      const shouldPlay = backVideoRef.current.style.zIndex === '2'
      if (shouldPlay) {
        console.log('背景视频可以播放，开始自动播放')
        backVideoPlayed.current = true
        backVideoRef.current.currentTime = 0
        backVideoRef.current.play().catch((error) => {
          console.warn('背景视频自动播放被阻止:', error)
        })
      }
    }
  }, [])

  // 处理视频播放错误
  const handleVideoError = useCallback((resourceId: string) => {
    return (e: React.SyntheticEvent<HTMLVideoElement>) => {
      console.error(`视频播放错误: ${resourceId}`, e)
      setError('视频播放失败')
      setIsLoading(false)
    }
  }, [])

  // 监听植物变化，初始化播放列表
  useEffect(() => {
    if (currentPlant) {
      initializePlaylist()
    }
  }, [currentPlant, initializePlaylist])

  // 加载当前视频和下一个视频
  useEffect(() => {
    if (!currentResourceId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log(`加载视频组合: ${currentResourceId} -> ${nextResourceId}`)

      // 获取当前视频URL
      const currentUrl = getResourceUrl(currentResourceId)
      setFrontVideoUrl(currentUrl)

      // 获取下一个视频URL
      if (nextResourceId && nextResourceId !== currentResourceId) {
        const nextUrl = getResourceUrl(nextResourceId)
        setBackVideoUrl(nextUrl)
      } else {
        setBackVideoUrl(currentUrl) // 如果没有下一个，使用相同的视频
      }

      setIsLoading(false)
    } catch (error) {
      console.error('加载视频失败:', error)
      setError('加载视频失败')
      setIsLoading(false)
    }
  }, [currentResourceId, nextResourceId, getResourceUrl])

  // 重置播放标志当URL变化时
  useEffect(() => {
    frontVideoPlayed.current = false
    backVideoPlayed.current = false
  }, [frontVideoUrl, backVideoUrl])

  // 处理图片加载完成
  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  // 处理图片加载错误
  const handleImageError = useCallback(() => {
    console.error(`图片加载错误: ${currentResourceId}`)
    setError('图片加载失败')
    setIsLoading(false)
  }, [currentResourceId])

  // 重新加载资源
  const handleReload = useCallback(() => {
    // 重新加载当前视频组合
    window.location.reload()
  }, [])

  // 加载状态
  if (isLoading && !frontVideoUrl && !backVideoUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">加载植物视频中...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error && !frontVideoUrl && !backVideoUrl) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={handleReload}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 前景视频 */}
      {frontVideoUrl && !isCurrentResourceImage && (
        <video
          key="front-video"
          ref={frontVideoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: frontVideoActive ? 2 : 1 }}
          src={frontVideoUrl}
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlay={handleFrontVideoCanPlay}
          onError={handleVideoError(currentResourceId || 'unknown')}
          onEnded={frontVideoActive ? handleVideoEnded : undefined}
        />
      )}

      {/* 背景视频 */}
      {backVideoUrl && !isCurrentResourceImage && (
        <video
          key="back-video"
          ref={backVideoRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: frontVideoActive ? 1 : 2 }}
          src={backVideoUrl}
          muted
          playsInline
          preload="auto"
          onCanPlay={handleBackVideoCanPlay}
          onError={handleVideoError(nextResourceId || 'unknown')}
          onEnded={!frontVideoActive ? handleVideoEnded : undefined}
        />
      )}

      {/* 图片元素 - seed-normal */}
      {isCurrentResourceImage && (
        <img
          ref={imageRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 2 }}
          src={frontVideoUrl || undefined}
          alt="Plant seed"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* 没有资源时显示渐变背景 */}
      {!frontVideoUrl && !backVideoUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-blue-900" />
      )}
      
      {/* 深色遮罩，确保上层内容可读 */}
      <div className="absolute inset-0 bg-black/30" style={{ zIndex: 10 }} />
      
      {/* 渐变遮罩，增强视觉效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" style={{ zIndex: 11 }} />

      {/* 调试信息 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded text-xs" style={{ zIndex: 20 }}>
          <div>当前资源: {currentResourceId}</div>
          <div>下一个资源: {nextResourceId}</div>
          <div>播放列表: {videoPlaylist.join(', ')}</div>
          <div>索引: {currentVideoIndex}</div>
          <div>植物阶段: {currentPlant?.currentGrowthStage}</div>
          <div>前景激活: {frontVideoActive ? '是' : '否'}</div>
        </div>
      )}
    </div>
  )
}
