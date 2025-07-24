import { useAppStore } from '@/store'

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
  private cacheStorage: Cache | null = null
  private readonly CACHE_NAME = 'memobloom-resources-v1'

  // 需要缓存的资源列表
  private readonly RESOURCES_TO_CACHE: CacheableResource[] = [
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

  // 缓存所有资源
  async cacheAllResources(): Promise<void> {
    const { updateResourceCacheProgress, setResourceCache } = useAppStore.getState()
    
    try {
      // 重置进度
      updateResourceCacheProgress(0)
      setResourceCache({ isLoaded: false, progress: 0 })

      const totalResources = this.RESOURCES_TO_CACHE.length
      let completedResources = 0

      // 并发缓存所有资源
      const cachePromises = this.RESOURCES_TO_CACHE.map(async (resource) => {
        try {
          await this.cacheResource(resource)
          completedResources++
          const progress = Math.round((completedResources / totalResources) * 100)
          updateResourceCacheProgress(progress)
          console.log(`Cached ${resource.key}: ${progress}%`)
        } catch (error) {
          console.error(`Failed to cache ${resource.key}:`, error)
          // 即使某个资源缓存失败，也继续缓存其他资源
          completedResources++
          const progress = Math.round((completedResources / totalResources) * 100)
          updateResourceCacheProgress(progress)
        }
      })

      await Promise.all(cachePromises)

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

  // 缓存单个资源
  private async cacheResource(resource: CacheableResource): Promise<void> {
    try {
      // 检查是否已经缓存
      if (await this.isResourceCached(resource.key)) {
        console.log(`Resource ${resource.key} already cached`)
        return
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
    const blob = await this.getCachedResource(key)
    if (blob) {
      return URL.createObjectURL(blob)
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
      // 清理内存缓存
      this.cache.clear()

      // 清理浏览器缓存
      if (this.cacheStorage) {
        const keys = await this.cacheStorage.keys()
        await Promise.all(keys.map(request => this.cacheStorage!.delete(request)))
      }

      // 重置状态
      const { setResourceCache } = useAppStore.getState()
      setResourceCache({ isLoaded: false, progress: 0 })

      console.log('Cache cleared successfully')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  // 释放对象URL
  revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url)
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
