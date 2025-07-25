import React, { useState, useEffect, useMemo } from 'react'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 资源映射
  const videoUrl = useMemo(() => {
    const resourceMap: Record<string, string> = {
      // 种子阶段
      'seed-happy': '/plantsVideo/seed_happy.mp4',
      'seed-normal': '/plantsVideo/seed_normal.png',
      'seed-sad': '/plantsVideo/seed_sad.mp4',
      // 幼苗阶段
      'sprout-happy': '/plantsVideo/sprout_happy.mp4',
      'sprout-normal': '/plantsVideo/sprout_normal.mp4',
      'sprout-sad': '/plantsVideo/sprout_sad.mp4',
      // 成熟阶段
      'mature-happy': '/plantsVideo/mature_happy.mp4',
      'mature-normal': '/plantsVideo/mature_normal.mp4',
      'mature-sad': '/plantsVideo/mature_sad.mp4',
      // 开花阶段
      'flowering-happy': '/plantsVideo/flowering_happy.mp4',
      'flowering-normal': '/plantsVideo/flowering_normal.mp4',
      'flowering-sad': '/plantsVideo/flowering_sad.mp4'
    }
    
    return resourceMap[`${stage}-${emotion}`] || null
  }, [stage, emotion])

  useEffect(() => {
    // 简单的加载状态模拟
    setLoading(true)
    setError(null)
    
    const timer = setTimeout(() => {
      if (videoUrl) {
        setLoading(false)
      } else {
        setError(`无法找到 ${stage}-${emotion} 资源`)
        setLoading(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [stage, emotion, videoUrl])

  const handleVideoError = () => {
    setError('视频播放失败')
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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            重新加载
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
