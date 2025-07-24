import { useAppStore } from '@/store'

export class PWAService {
  private static instance: PWAService
  private registration: ServiceWorkerRegistration | null = null
  
  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  // 初始化PWA服务
  async init() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready
        console.log('Service Worker registered successfully')
        
        // 监听在线/离线状态
        this.setupOnlineOfflineListeners()
        
        // 设置推送通知
        await this.setupPushNotifications()
        
        // 设置后台同步
        this.setupBackgroundSync()
        
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  // 设置在线/离线监听
  private setupOnlineOfflineListeners() {
    const updateOnlineStatus = () => {
      useAppStore.getState().setOnlineStatus(navigator.onLine)
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // 初始状态
    updateOnlineStatus()
  }

  // 设置推送通知
  async setupPushNotifications() {
    if (!('Notification' in window) || !this.registration) {
      console.log('Push messaging is not supported')
      return
    }

    // 请求通知权限
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return
    }

    try {
      // 订阅推送服务
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
        )
      })

      console.log('Push subscription created:', subscription)
      
      // 将订阅信息发送到服务器
      await this.sendSubscriptionToServer(subscription)
      
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
    }
  }

  // 设置后台同步
  private setupBackgroundSync() {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.log('Background sync is not supported')
      return
    }

    // 监听网络状态变化，在重新连接时触发同步
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC') {
        console.log('Background sync completed:', event.data.payload)
        
        // 更新本地状态
        const { addNotification } = useAppStore.getState()
        addNotification({
          title: '数据同步完成',
          message: '您的数据已成功同步到云端',
          type: 'success',
          read: false
        })
      }
    })
  }

  // 发送本地推送通知
  async sendLocalNotification(title: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options
      })
    }
  }

  // 注册后台同步任务
  async registerBackgroundSync(tag: string) {
    if (this.registration && 'sync' in this.registration) {
      try {
        await this.registration.sync.register(tag)
        console.log(`Background sync registered: ${tag}`)
      } catch (error) {
        console.error('Background sync registration failed:', error)
      }
    }
  }

  // 工具方法：将VAPID密钥转换为Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // 发送订阅信息到服务器
  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      // 这里应该调用您的API来保存订阅信息
      console.log('Sending subscription to server:', subscription)
      
      // 示例：
      // await apiService.push.subscribe(subscription)
      
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }
}

// 导出单例实例
export const pwaService = PWAService.getInstance()
