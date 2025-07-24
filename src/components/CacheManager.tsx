import React, { useState, useEffect } from 'react'
import { resourceCacheService } from '@/services/resourceCache'
import { useAppStore } from '@/store'

interface CacheUsageStats {
  totalSize: number
  formattedSize: string
  itemCount: number
  byType: { video: number; image: number; audio: number }
  byStage: { background: number; seed: number; sprout: number; mature: number; flowering: number }
}

export const CacheManager: React.FC = () => {
  const { resourceCache } = useAppStore()
  const [cacheStats, setCacheStats] = useState<CacheUsageStats | null>(null)
  const [integrity, setIntegrity] = useState<{ isComplete: boolean; missingResources: string[] } | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    updateCacheInfo()
    
    // 监听在线/离线状态
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    setIsOffline(!navigator.onLine)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateCacheInfo = async () => {
    try {
      const stats = resourceCacheService.getCacheUsageStats()
      const integrityCheck = await resourceCacheService.checkCacheIntegrity()
      
      setCacheStats(stats)
      setIntegrity(integrityCheck)
    } catch (error) {
      console.error('获取缓存信息失败:', error)
    }
  }

  const handleCacheAll = async () => {
    setLoading(true)
    try {
      await resourceCacheService.cacheAllResources()
      await updateCacheInfo()
    } catch (error) {
      console.error('缓存资源失败:', error)
    }
    setLoading(false)
  }

  const handleCacheHighPriority = async () => {
    setLoading(true)
    try {
      await resourceCacheService.cacheHighPriorityResources()
      await updateCacheInfo()
    } catch (error) {
      console.error('缓存高优先级资源失败:', error)
    }
    setLoading(false)
  }

  const handleRepairCache = async () => {
    setLoading(true)
    try {
      await resourceCacheService.repairCache()
      await updateCacheInfo()
    } catch (error) {
      console.error('修复缓存失败:', error)
    }
    setLoading(false)
  }

  const handleClearCache = async () => {
    if (!confirm('确认要清理所有缓存吗？这将需要重新下载所有资源。')) {
      return
    }
    
    setLoading(true)
    try {
      await resourceCacheService.clearCache()
      await updateCacheInfo()
    } catch (error) {
      console.error('清理缓存失败:', error)
    }
    setLoading(false)
  }

  const getStatusColor = () => {
    if (isOffline) return 'text-orange-600'
    if (!integrity?.isComplete) return 'text-red-600'
    if (resourceCache.isLoaded) return 'text-green-600'
    return 'text-gray-600'
  }

  const getStatusText = () => {
    if (isOffline) return '离线模式'
    if (!integrity?.isComplete) return '缓存不完整'
    if (resourceCache.isLoaded) return '缓存就绪'
    return '缓存未完成'
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">缓存管理</h2>
        <div className={`flex items-center ${getStatusColor()}`}>
          <div className={`w-3 h-3 rounded-full mr-2 ${
            isOffline ? 'bg-orange-500' : 
            !integrity?.isComplete ? 'bg-red-500' : 
            resourceCache.isLoaded ? 'bg-green-500' : 'bg-gray-500'
          }`}></div>
          <span className="font-medium">{getStatusText()}</span>
        </div>
      </div>

      {/* 缓存进度 */}
      {resourceCache.progress > 0 && resourceCache.progress < 100 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>缓存进度</span>
            <span>{resourceCache.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${resourceCache.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 缓存统计 */}
      {cacheStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">总大小</h3>
            <p className="text-2xl font-bold text-blue-600">{cacheStats.formattedSize}</p>
            <p className="text-sm text-blue-600">{cacheStats.itemCount} 个文件</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">文件类型</h3>
            <div className="text-sm text-green-600">
              <p>视频: {cacheStats.byType.video} 个</p>
              <p>图片: {cacheStats.byType.image} 个</p>
              <p>音频: {cacheStats.byType.audio} 个</p>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">植物阶段</h3>
            <div className="text-sm text-purple-600">
              <p>种子: {cacheStats.byStage.seed} 个</p>
              <p>幼苗: {cacheStats.byStage.sprout} 个</p>
              <p>成熟: {cacheStats.byStage.mature} 个</p>
              <p>开花: {cacheStats.byStage.flowering} 个</p>
            </div>
          </div>
        </div>
      )}

      {/* 缓存完整性 */}
      {integrity && (
        <div className={`p-4 rounded-lg mb-6 ${
          integrity.isComplete ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center mb-2">
            <span className={`font-semibold ${
              integrity.isComplete ? 'text-green-800' : 'text-red-800'
            }`}>
              缓存完整性检查
            </span>
          </div>
          {integrity.isComplete ? (
            <p className="text-green-600">✅ 所有资源已缓存，离线游戏就绪</p>
          ) : (
            <div className="text-red-600">
              <p className="mb-2">❌ 缺失 {integrity.missingResources.length} 个资源</p>
              <details className="text-sm">
                <summary className="cursor-pointer hover:text-red-800">查看缺失资源</summary>
                <ul className="mt-2 ml-4 list-disc">
                  {integrity.missingResources.map(resource => (
                    <li key={resource}>{resource}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCacheAll}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '处理中...' : '缓存所有资源'}
        </button>
        
        <button
          onClick={handleCacheHighPriority}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          缓存高优先级
        </button>
        
        {integrity && !integrity.isComplete && (
          <button
            onClick={handleRepairCache}
            disabled={loading || isOffline}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            修复缓存
          </button>
        )}
        
        <button
          onClick={handleClearCache}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          清理缓存
        </button>
        
        <button
          onClick={updateCacheInfo}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          刷新信息
        </button>
      </div>

      {/* 错误信息 */}
      {resourceCache.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">❌ {resourceCache.error}</p>
        </div>
      )}

      {/* 离线提示 */}
      {isOffline && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-orange-600">🔌 当前处于离线状态，某些功能可能受限</p>
        </div>
      )}
    </div>
  )
}

export default CacheManager
