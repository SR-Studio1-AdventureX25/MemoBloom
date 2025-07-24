import { useEffect, useRef, useState } from 'react'
import { resourceCacheService } from '@/services/resourceCache'

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCachedVideo()
    
    // 清理函数
    return () => {
      if (videoUrl) {
        resourceCacheService.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  const loadCachedVideo = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 尝试获取缓存的视频
      const cachedVideoUrl = await resourceCacheService.getCachedResourceURL('background-video')
      
      if (cachedVideoUrl) {
        setVideoUrl(cachedVideoUrl)
      } else {
        // 如果缓存中没有，回退到直接使用视频文件
        console.warn('Cached video not found, falling back to direct video')
        setVideoUrl('/background.mp4')
      }
    } catch (error) {
      console.error('Failed to load cached video:', error)
      // 离线时不显示错误，直接使用渐变背景
      setError(null)
      setVideoUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleVideoError = () => {
    console.error('Video playback error')
    setError('视频播放失败')
    setIsLoading(false)
  }

  const handleVideoCanPlay = () => {
    // 确保视频可以播放
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.warn('Auto-play prevented:', error)
      })
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">加载背景视频中...</p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
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
            onClick={loadCachedVideo}
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
      {videoUrl && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={handleVideoLoad}
          onCanPlay={handleVideoCanPlay}
          onError={handleVideoError}
        />
      )}
      
      {/* 深色遮罩，确保上层内容可读 */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* 渐变遮罩，增强视觉效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
    </div>
  )
}
