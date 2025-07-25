import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useAppStore } from '@/store'
import { useCurrentPlant } from '@/store/selectors'
import { getResourceUrl, isImageResource } from '@/constants/videoResources'

export function useVideoPlayback() {
  const { 
    videoPlaylist, 
    currentVideoIndex, 
    setCurrentVideoIndex, 
    updateVideoPlaylist 
  } = useAppStore()
  
  const currentPlant = useCurrentPlant()
  const frontVideoRef = useRef<HTMLVideoElement>(null)
  const backVideoRef = useRef<HTMLVideoElement>(null)
  const [frontVideoUrl, setFrontVideoUrl] = useState<string | null>(null)
  const [backVideoUrl, setBackVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frontVideoActive, setFrontVideoActive] = useState(true) // 控制哪个video在前景
  const frontVideoPlayedRef = useRef(false)
  const backVideoPlayedRef = useRef(false)

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

  // 判断当前资源是否为图片
  const isCurrentResourceImage = useMemo(() => {
    return currentResourceId ? isImageResource(currentResourceId) : false
  }, [currentResourceId])

  // 初始化播放列表
  const initializePlaylist = useCallback(() => {
    if (!currentPlant) return

    const stage = currentPlant.currentGrowthStage
    const normalVideoId = `plant-${stage}-normal`
    
    // 初始化为循环播放normal视频
    updateVideoPlaylist([normalVideoId, normalVideoId])
  }, [currentPlant, updateVideoPlaylist])

  // 处理视频播放结束
  const handleVideoEnded = useCallback(() => {
    console.log(`视频播放完成: ${currentResourceId}`)
    
    // 获取下一个视频索引
    const nextIndex = (currentVideoIndex + 1) % videoPlaylist.length
    const nextResourceIdValue = videoPlaylist[nextIndex]
    
    // 如果下一个资源和当前资源相同，直接重新播放当前活跃的视频
    if (nextResourceIdValue === currentResourceId) {
      const activeVideoRef = frontVideoActive ? frontVideoRef : backVideoRef
      if (activeVideoRef.current) {
        console.log('播放列表中是相同资源，重新播放')
        activeVideoRef.current.currentTime = 0
        activeVideoRef.current.play().catch((error: unknown) => {
          console.warn('重新播放视频失败:', error)
        })
      }
      return
    }
    
    // 切换到下一个视频
    setCurrentVideoIndex(nextIndex)
    
    // 切换前后景
    setFrontVideoActive(prev => {
      const newActive = !prev
      console.log(`切换前后景: ${prev} -> ${newActive}`)
      
      // 重置播放标志，让新的前景视频可以播放
      setTimeout(() => {
        if (newActive) {
          frontVideoPlayedRef.current = false
          if (frontVideoRef.current) {
            console.log('重置前景视频播放标志，准备播放')
            frontVideoRef.current.currentTime = 0
            frontVideoRef.current.play().catch((error: unknown) => {
              console.warn('切换后播放前景视频失败:', error)
            })
          }
        } else {
          backVideoPlayedRef.current = false
          if (backVideoRef.current) {
            console.log('重置背景视频播放标志，准备播放')
            backVideoRef.current.currentTime = 0
            backVideoRef.current.play().catch((error: unknown) => {
              console.warn('切换后播放背景视频失败:', error)
            })
          }
        }
      }, 50) // 给DOM更新一点时间
      
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
  }, [currentResourceId, currentVideoIndex, videoPlaylist, frontVideoActive, setCurrentVideoIndex, updateVideoPlaylist, currentPlant])

  // 处理前景视频可以播放
  const handleFrontVideoCanPlay = useCallback(() => {
    if (frontVideoRef.current && !frontVideoPlayedRef.current) {
      // 检查前景视频是否应该播放
      const shouldPlay = frontVideoActive
      if (shouldPlay) {
        console.log('前景视频可以播放，开始自动播放')
        frontVideoPlayedRef.current = true
        frontVideoRef.current.currentTime = 0
        frontVideoRef.current.play().catch((error: unknown) => {
          console.warn('前景视频自动播放被阻止:', error)
        })
      }
    }
  }, [frontVideoActive])

  // 处理背景视频可以播放
  const handleBackVideoCanPlay = useCallback(() => {
    if (backVideoRef.current && !backVideoPlayedRef.current) {
      // 检查背景视频是否应该播放
      const shouldPlay = !frontVideoActive
      if (shouldPlay) {
        console.log('背景视频可以播放，开始自动播放')
        backVideoPlayedRef.current = true
        backVideoRef.current.currentTime = 0
        backVideoRef.current.play().catch((error: unknown) => {
          console.warn('背景视频自动播放被阻止:', error)
        })
      }
    }
  }, [frontVideoActive])

  // 处理视频播放错误
  const handleVideoError = useCallback((resourceId: string) => {
    return (e: React.SyntheticEvent<HTMLVideoElement>) => {
      console.error(`视频播放错误: ${resourceId}`, e)
      setError('视频播放失败')
      setIsLoading(false)
    }
  }, [])

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

      console.log(`加载视频组合: ${currentResourceId} -> ${nextResourceId}, frontVideoActive: ${frontVideoActive}`)

      const currentUrl = getResourceUrl(currentResourceId)
      const nextUrl = nextResourceId ? getResourceUrl(nextResourceId) : currentUrl

      // 根据frontVideoActive状态分配视频资源
      if (frontVideoActive) {
        // 前景视频显示当前资源，背景视频预加载下一个资源
        setFrontVideoUrl(currentUrl)
        setBackVideoUrl(nextUrl)
      } else {
        // 背景视频显示当前资源，前景视频预加载下一个资源
        setBackVideoUrl(currentUrl)
        setFrontVideoUrl(nextUrl)
      }

      setIsLoading(false)
    } catch (error) {
      console.error('加载视频失败:', error)
      setError('加载视频失败')
      setIsLoading(false)
    }
  }, [currentResourceId, nextResourceId, frontVideoActive, videoPlaylist])

  // 重置播放标志当URL变化时
  useEffect(() => {
    frontVideoPlayedRef.current = false
    backVideoPlayedRef.current = false
  }, [frontVideoUrl, backVideoUrl])

  // 图片定时切换逻辑
  useEffect(() => {
    if (isCurrentResourceImage) {
      console.log(`图片资源开始显示: ${currentResourceId}，3秒后切换`)
      const timer = setTimeout(() => {
        console.log(`图片显示时间到，切换到下一个资源`)
        handleVideoEnded()
      }, 3000) // 3秒后自动切换
      
      return () => {
        clearTimeout(timer)
        console.log(`清除图片定时器`)
      }
    }
  }, [isCurrentResourceImage, currentResourceId, handleVideoEnded])

  return {
    frontVideoRef,
    backVideoRef,
    frontVideoUrl,
    backVideoUrl,
    currentResourceId,
    isCurrentResourceImage,
    isLoading,
    error,
    currentPlant,
    videoPlaylist,
    currentVideoIndex,
    frontVideoActive,
    handleVideoEnded,
    handleFrontVideoCanPlay,
    handleBackVideoCanPlay,
    handleVideoError,
    handleImageLoad,
    handleImageError
  }
}
