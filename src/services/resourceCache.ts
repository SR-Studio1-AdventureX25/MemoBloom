import { useAppStore } from '@/store'

// 获取资源缓存相关的 actions
const getResourceCacheActions = () => {
  const store = useAppStore.getState()
  return {
    setResourceCache: store.setResourceCache,
    updateResourceCacheProgress: store.updateResourceCacheProgress
  }
}

// 资源类型定义
interface CacheableResource {
  url: string
  key: string
  type: 'video' | 'image' | 'audio'
  size?: number
}

// 缓存状态
interface CacheItem {
  key: string
  url: string
  blob: Blob
  cachedAt: Date
  size: number
}

export class ResourceCacheService {
  private static instance: ResourceCacheService
  private cache: Map<string, CacheItem> = new Map()
  private objectURLCache: Map<string, string> = new Map()
  private cacheStorage: Cache | null = null
  private readonly CACHE_NAME = 'memobloom-resources-v1'

  // 需要缓存的资源列表（按优先级分组）
  private readonly RESOURCES_TO_CACHE: CacheableResource[] = [
    // 基础资源
    {
      url: '/background.mp4',
      key: 'background-video',
      type: 'video'
    },
    {
      url: '/pwa-192x192.png',
      key: 'pwa-icon-192',
      type: 'image'
    },
    {
      url: '/pwa-512x512.png',
      key: 'pwa-icon-512',
      type: 'image'
    },
    // 植物视频资源 - 高优先级（种子和幼苗阶段）
    {
      url: '/plantsVideo/seed_happy.mp4',
      key: 'plant-seed-happy',
      type: 'video'
    },
    {
      url: '/plantsVideo/seed_normal.png',
      key: 'plant-seed-normal',
      type: 'image'
    },
    {
      url: '/plantsVideo/seed_sad.mp4',
      key: 'plant-seed-sad',
      type: 'video'
    },
    {
      url: '/plantsVideo/sprout_happy.mp4',
      key: 'plant-sprout-happy',
      type: 'video'
    },
    {
      url: '/plantsVideo/sprout_normal.mp4',
      key: 'plant-sprout-normal',
      type: 'video'
    },
    {
      url: '/plantsVideo/sprout_sad.mp4',
      key: 'plant-sprout-sad',
      type: 'video'
    },
    // 植物视频资源 - 中优先级（成熟阶段）
    {
      url: '/plantsVideo/mature_happy.mp4',
      key: 'plant-mature-happy',
      type: 'video'
    },
    {
      url: '/plantsVideo/mature_normal.mp4',
      key: 'plant-mature-normal',
      type: 'video'
    },
    {
      url: '/plantsVideo/mature_sad.mp4',
      key: 'plant-mature-sad',
      type: 'video'
    },
    // 植物视频资源 - 低优先级（开花阶段）
    {
      url: '/plantsVideo/flowering_happy.mp4',
      key: 'plant-flowering-happy',
      type: 'video'
    },
    {
      url: '/plantsVideo/flowering_normal.mp4',
      key: 'plant-flowering-normal',
      type: 'video'
    },
    {
      url: '/plantsVideo/flowering_sad.mp4',
      key: 'plant-flowering-sad',
      type: 'video'
    }
  ]

  public static getInstance(): ResourceCacheService {
    if (!ResourceCacheService.instance) {
      ResourceCacheService.instance = new ResourceCacheService()
    }
    return ResourceCacheService.instance
  }

  // 初始化缓存
  async init(): Promise<void> {
    try {
      if ('caches' in window) {
        this.cacheStorage = await caches.open(this.CACHE_NAME)
        console.log('Resource cache initialized')
      } else {
        console.warn('Cache Storage not supported, using memory cache only')
      }
    } catch (error) {
      console.error('Failed to initialize resource cache:', error)
    }
  }

  // 缓存所有资源（分阶段缓存）
  async cacheAllResources(): Promise<void> {
    const { updateResourceCacheProgress, setResourceCache } = getResourceCacheActions()
    
    try {
      // 重置进度
      updateResourceCacheProgress(0)
      setResourceCache({ isLoaded: false, progress: 0 })

      // 分阶段缓存资源
      await this.cacheResourcesByStages()

      // 完成缓存
      setResourceCache({ isLoaded: true, progress: 100 })
      console.log('All resources cached successfully')

    } catch (error) {
      console.error('Failed to cache resources:', error)
      setResourceCache({ 
        isLoaded: false, 
        progress: 0, 
        error: error instanceof Error ? error.message : '缓存失败' 
      })
    }
  }

  // 分阶段缓存资源
  private async cacheResourcesByStages(): Promise<void> {
    const { updateResourceCacheProgress } = getResourceCacheActions()
    
    // 定义优先级分组
    const highPriorityResources = this.RESOURCES_TO_CACHE.filter(r => 
      r.key.includes('background') || 
      r.key.includes('pwa-icon') || 
      r.key.includes('seed') || 
      r.key.includes('sprout')
    )
    
    const mediumPriorityResources = this.RESOURCES_TO_CACHE.filter(r => 
      r.key.includes('mature')
    )
    
    const lowPriorityResources = this.RESOURCES_TO_CACHE.filter(r => 
      r.key.includes('flowering')
    )

    const totalResources = this.RESOURCES_TO_CACHE.length
    let completedResources = 0

    // 阶段1：高优先级资源（基础资源 + 种子/幼苗阶段）
    console.log('缓存阶段1：基础资源和早期植物阶段')
    for (const resource of highPriorityResources) {
      try {
        await this.cacheResource(resource)
        completedResources++
        const progress = Math.round((completedResources / totalResources) * 100)
        updateResourceCacheProgress(progress)
        console.log(`高优先级缓存 ${resource.key}: ${progress}%`)
      } catch (error) {
        console.error(`Failed to cache high priority ${resource.key}:`, error)
        completedResources++
        const progress = Math.round((completedResources / totalResources) * 100)
        updateResourceCacheProgress(progress)
      }
    }

    // 阶段2：中优先级资源（成熟阶段）
    console.log('缓存阶段2：植物成熟阶段')
    for (const resource of mediumPriorityResources) {
      try {
        await this.cacheResource(resource)
        completedResources++
        const progress = Math.round((completedResources / totalResources) * 100)
        updateResourceCacheProgress(progress)
        console.log(`中优先级缓存 ${resource.key}: ${progress}%`)
      } catch (error) {
        console.error(`Failed to cache medium priority ${resource.key}:`, error)
        completedResources++
        const progress = Math.round((completedResources / totalResources) * 100)
        updateResourceCacheProgress(progress)
      }
    }

    // 阶段3：低优先级资源（开花阶段）
    console.log('缓存阶段3：植物开花阶段')
    for (const resource of lowPriorityResources) {
      try {
        await this.cacheResource(resource)
        completedResources++
        const progress = Math.round((completedResources / totalResources) * 100)
        updateResourceCacheProgress(progress)
        console.log(`低优先级缓存 ${resource.key}: ${progress}%`)
      } catch (error) {
        console.error(`Failed to cache low priority ${resource.key}:`, error)
        completedResources++
        const progress = Math.round((completedResources / totalResources) * 100)
        updateResourceCacheProgress(progress)
      }
    }
  }

  // 快速缓存高优先级资源
  async cacheHighPriorityResources(): Promise<void> {
    const { updateResourceCacheProgress, setResourceCache } = getResourceCacheActions()
    
    try {
      const highPriorityResources = this.RESOURCES_TO_CACHE.filter(r => 
        r.key.includes('background') || 
        r.key.includes('pwa-icon') || 
        r.key.includes('seed') || 
        r.key.includes('sprout')
      )

      updateResourceCacheProgress(0)
      setResourceCache({ isLoaded: false, progress: 0 })

      let completedResources = 0
      const totalResources = highPriorityResources.length

      for (const resource of highPriorityResources) {
        try {
          await this.cacheResource(resource)
          completedResources++
          const progress = Math.round((completedResources / totalResources) * 100)
          updateResourceCacheProgress(progress)
          console.log(`高优先级缓存 ${resource.key}: ${progress}%`)
        } catch (error) {
          console.error(`Failed to cache high priority ${resource.key}:`, error)
          completedResources++
        }
      }

      console.log('高优先级资源缓存完成')
    } catch (error) {
      console.error('Failed to cache high priority resources:', error)
    }
  }

  // 缓存单个资源
  private async cacheResource(resource: CacheableResource): Promise<void> {
    try {
      // 检查是否已经缓存
      if (await this.isResourceCached(resource.key)) {
        console.log(`Resource ${resource.key} already cached`)
        return
      }

      // 如果资源正在被重新缓存，先清理旧的 Object URL
      if (this.objectURLCache.has(resource.key)) {
        const oldObjectURL = this.objectURLCache.get(resource.key)!
        URL.revokeObjectURL(oldObjectURL)
        this.objectURLCache.delete(resource.key)
      }

      // 下载资源
      const response = await fetch(resource.url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${resource.url}: ${response.status}`)
      }

      // 先clone Response用于浏览器缓存，再读取blob
      const responseClone = response.clone()
      const blob = await response.blob()
      
      const cacheItem: CacheItem = {
        key: resource.key,
        url: resource.url,
        blob,
        cachedAt: new Date(),
        size: blob.size
      }

      // 存储到内存缓存
      this.cache.set(resource.key, cacheItem)

      // 存储到浏览器缓存
      if (this.cacheStorage) {
        await this.cacheStorage.put(resource.url, responseClone)
      }

      console.log(`Resource ${resource.key} cached successfully (${this.formatBytes(blob.size)})`)

    } catch (error) {
      console.error(`Failed to cache resource ${resource.key}:`, error)
      throw error
    }
  }

  // 检查资源是否已缓存
  async isResourceCached(key: string): Promise<boolean> {
    // 检查内存缓存
    if (this.cache.has(key)) {
      return true
    }

    // 检查浏览器缓存
    if (this.cacheStorage) {
      const resource = this.RESOURCES_TO_CACHE.find(r => r.key === key)
      if (resource) {
        const response = await this.cacheStorage.match(resource.url)
        if (response) {
          // 如果浏览器缓存中有，但内存缓存中没有，则加载到内存缓存
          const blob = await response.blob()
          this.cache.set(key, {
            key,
            url: resource.url,
            blob,
            cachedAt: new Date(),
            size: blob.size
          })
          return true
        }
      }
    }

    return false
  }

  // 获取缓存的资源
  async getCachedResource(key: string): Promise<Blob | null> {
    const cacheItem = this.cache.get(key)
    if (cacheItem) {
      return cacheItem.blob
    }

    // 尝试从浏览器缓存加载
    if (this.cacheStorage) {
      const resource = this.RESOURCES_TO_CACHE.find(r => r.key === key)
      if (resource) {
        const response = await this.cacheStorage.match(resource.url)
        if (response) {
          const blob = await response.blob()
          // 加载到内存缓存
          this.cache.set(key, {
            key,
            url: resource.url,
            blob,
            cachedAt: new Date(),
            size: blob.size
          })
          return blob
        }
      }
    }

    return null
  }

  // 获取缓存的资源URL
  async getCachedResourceURL(key: string): Promise<string | null> {
    // 检查是否已有缓存的 Object URL
    if (this.objectURLCache.has(key)) {
      return this.objectURLCache.get(key)!
    }

    // 获取 blob 并创建 Object URL
    const blob = await this.getCachedResource(key)
    if (blob) {
      const objectURL = URL.createObjectURL(blob)
      this.objectURLCache.set(key, objectURL)
      return objectURL
    }
    return null
  }

  // 检查是否所有资源都已缓存
  async areAllResourcesCached(): Promise<boolean> {
    for (const resource of this.RESOURCES_TO_CACHE) {
      if (!(await this.isResourceCached(resource.key))) {
        return false
      }
    }
    return true
  }

  // 获取缓存统计信息
  getCacheStats(): { totalSize: number; itemCount: number; items: Array<{ key: string; size: number; cachedAt: Date }> } {
    let totalSize = 0
    const items: Array<{ key: string; size: number; cachedAt: Date }> = []

    this.cache.forEach((item) => {
      totalSize += item.size
      items.push({
        key: item.key,
        size: item.size,
        cachedAt: item.cachedAt
      })
    })

    return {
      totalSize,
      itemCount: this.cache.size,
      items
    }
  }

  // 清理缓存
  async clearCache(): Promise<void> {
    try {
      // 清理 Object URLs
      this.clearObjectURLs()

      // 清理内存缓存
      this.cache.clear()

      // 清理浏览器缓存
      if (this.cacheStorage) {
        const keys = await this.cacheStorage.keys()
        await Promise.all(keys.map(request => this.cacheStorage!.delete(request)))
      }

      // 重置状态
      const { setResourceCache } = getResourceCacheActions()
      setResourceCache({ isLoaded: false, progress: 0 })

      console.log('Cache cleared successfully')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  // 清理所有 Object URLs
  private clearObjectURLs(): void {
    this.objectURLCache.forEach(url => {
      URL.revokeObjectURL(url)
    })
    this.objectURLCache.clear()
    console.log('All Object URLs revoked')
  }

  // 释放对象URL
  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url)
  }

  // 检查离线状态
  isOffline(): boolean {
    return !navigator.onLine
  }

  // 检查缓存完整性
  async checkCacheIntegrity(): Promise<{ isComplete: boolean; missingResources: string[] }> {
    const missingResources: string[] = []
    
    for (const resource of this.RESOURCES_TO_CACHE) {
      const isCached = await this.isResourceCached(resource.key)
      if (!isCached) {
        missingResources.push(resource.key)
      }
    }
    
    return {
      isComplete: missingResources.length === 0,
      missingResources
    }
  }

  // 修复缺失的缓存资源
  async repairCache(): Promise<void> {
    const { updateResourceCacheProgress, setResourceCache } = getResourceCacheActions()
    
    try {
      const integrity = await this.checkCacheIntegrity()
      
      if (integrity.isComplete) {
        console.log('缓存完整，无需修复')
        return
      }

      console.log(`发现 ${integrity.missingResources.length} 个缺失资源，开始修复...`)
      
      updateResourceCacheProgress(0)
      setResourceCache({ isLoaded: false, progress: 0 })

      let repairedCount = 0
      const totalMissing = integrity.missingResources.length

      for (const missingKey of integrity.missingResources) {
        const resource = this.RESOURCES_TO_CACHE.find(r => r.key === missingKey)
        if (resource) {
          try {
            await this.cacheResource(resource)
            repairedCount++
            const progress = Math.round((repairedCount / totalMissing) * 100)
            updateResourceCacheProgress(progress)
            console.log(`修复缓存 ${resource.key}: ${progress}%`)
          } catch (error) {
            console.error(`修复缓存失败 ${resource.key}:`, error)
          }
        }
      }

      setResourceCache({ isLoaded: true, progress: 100 })
      console.log(`缓存修复完成，修复了 ${repairedCount}/${totalMissing} 个资源`)

    } catch (error) {
      console.error('缓存修复失败:', error)
      setResourceCache({ 
        isLoaded: false, 
        progress: 0, 
        error: error instanceof Error ? error.message : '缓存修复失败' 
      })
    }
  }

  // 获取植物视频资源URL（便捷方法）
  async getPlantVideoURL(stage: 'seed' | 'sprout' | 'mature' | 'flowering', emotion: 'happy' | 'normal' | 'sad'): Promise<string | null> {
    const key = `plant-${stage}-${emotion}`
    return await this.getCachedResourceURL(key)
  }

  // 预加载下一阶段资源（后台加载）
  async preloadNextStageResources(currentStage: 'seed' | 'sprout' | 'mature'): Promise<void> {
    const nextStageMap = {
      'seed': 'sprout',
      'sprout': 'mature',
      'mature': 'flowering'
    }

    const nextStage = nextStageMap[currentStage]
    if (!nextStage) return

    console.log(`预加载下一阶段资源: ${nextStage}`)

    const nextStageResources = this.RESOURCES_TO_CACHE.filter(r => 
      r.key.includes(`plant-${nextStage}`)
    )

    // 后台异步加载，不阻塞主流程
    Promise.all(
      nextStageResources.map(async (resource) => {
        try {
          if (!(await this.isResourceCached(resource.key))) {
            await this.cacheResource(resource)
            console.log(`预加载完成: ${resource.key}`)
          }
        } catch (error) {
          console.error(`预加载失败 ${resource.key}:`, error)
        }
      })
    ).catch(error => {
      console.error('预加载过程中出现错误:', error)
    })
  }

  // 获取缓存使用情况统计
  getCacheUsageStats(): {
    totalSize: number
    formattedSize: string
    itemCount: number
    byType: { video: number; image: number; audio: number }
    byStage: { background: number; seed: number; sprout: number; mature: number; flowering: number }
  } {
    const stats = this.getCacheStats()
    
    const byType = { video: 0, image: 0, audio: 0 }
    const byStage = { 
      background: 0, 
      seed: 0, 
      sprout: 0, 
      mature: 0, 
      flowering: 0 
    }

    stats.items.forEach(item => {
      // 按类型分组
      const resource = this.RESOURCES_TO_CACHE.find(r => r.key === item.key)
      if (resource) {
        byType[resource.type]++
      }

      // 按阶段分组
      if (item.key.includes('background')) byStage.background++
      else if (item.key.includes('seed')) byStage.seed++
      else if (item.key.includes('sprout')) byStage.sprout++
      else if (item.key.includes('mature')) byStage.mature++
      else if (item.key.includes('flowering')) byStage.flowering++
    })

    return {
      totalSize: stats.totalSize,
      formattedSize: this.formatBytes(stats.totalSize),
      itemCount: stats.itemCount,
      byType,
      byStage
    }
  }

  // 格式化字节大小
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

}

// 导出单例实例
export const resourceCacheService = ResourceCacheService.getInstance()
