import React, { useState, useEffect } from 'react'
import { resourceCacheService } from '@/services/resourceCache'

interface PlantDisplayProps {
  stage: 'seed' | 'sprout' | 'mature' | 'flowering'
  emotion: 'happy' | 'normal' | 'sad'
  onStageChange?: (newStage: 'seed' | 'sprout' | 'mature' | 'flowering') => void
}

export const PlantDisplay: React.FC<PlantDisplayProps> = ({ 
  stage, 
  emotion, 
  onStageChange 
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPlantVideo()
    // 预加载下一阶段资源
    if (stage !== 'flowering') {
      resourceCacheService.preloadNextStageResources(stage)
    }
  }, [stage, emotion])

  const loadPlantVideo = async () => {
    try {
      setLoading(true)
      setError(null)

      // 使用新的便捷方法获取植物视频URL
      const url = await resourceCacheService.getPlantVideoURL(stage, emotion)
      
      if (url) {
        setVideoUrl(url)
      } else {
        // 如果缓存中没有，尝试修复缓存
        console.log(`缓存中未找到 ${stage}-${emotion} 视频，尝试修复缓存...`)
        await resourceCacheService.repairCache()
        
        // 再次尝试获取
        const repairedUrl = await resourceCacheService.getPlantVideoURL(stage, emotion)
        if (repairedUrl) {
          setVideoUrl(repairedUrl)
        } else {
          throw new Error(`无法加载 ${stage}-${emotion} 植物视频`)
        }
      }
    } catch (err) {
      console.error('加载植物视频失败:', err)
      setError(err instanceof Error ? err.message : '加载视频失败')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoError = () => {
    setError('视频播放失败')
    // 尝试重新加载
    loadPlantVideo()
  }

  const simulateGrowth = () => {
    const stages: Array<'seed' | 'sprout' | 'mature' | 'flowering'> = 
      ['seed', 'sprout', 'mature', 'flowering']
    const currentIndex = stages.indexOf(stage)
    
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1]
      onStageChange?.(nextStage)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-gray-600">加载植物视频中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={loadPlantVideo}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-64 bg-green-50 rounded-lg overflow-hidden">
      {videoUrl && (
        <>
          {stage === 'seed' && emotion === 'normal' ? (
            // seed_normal 是 PNG 图片
            <img
              src={videoUrl}
              alt={`${stage}-${emotion}`}
              className="w-full h-full object-contain"
              onError={handleVideoError}
            />
          ) : (
            // 其他都是视频文件
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              className="w-full h-full object-contain"
              onError={handleVideoError}
            >
              您的浏览器不支持视频播放
            </video>
          )}
          
          {/* 植物信息叠加层 */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {stage} - {emotion}
          </div>
          
          {/* 成长按钮 */}
          {stage !== 'flowering' && (
            <div className="absolute bottom-2 right-2">
              <button
                onClick={simulateGrowth}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                成长 🌱
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PlantDisplay
