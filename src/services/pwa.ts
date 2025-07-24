import { useAppStore } from '@/store'

// PWA 相关类型定义
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
  
  interface Navigator {
    standalone?: boolean
  }
}

export class PWAService {
  private static instance: PWAService
  private registration: ServiceWorkerRegistration | null = null
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private installPromptListeners: Array<(canInstall: boolean) => void> = []
  
  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  // 初始化PWA服务
  async init() {
    // 设置PWA安装监听
    this.setupInstallPrompt()
    
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
      const messageData = event.data as { type: string; payload?: unknown }
      if (messageData && messageData.type === 'BACKGROUND_SYNC') {
        console.log('Background sync completed:', messageData.payload)
        
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

  // ===== PWA 安装相关方法 =====

  // 设置PWA安装提示监听
  private setupInstallPrompt() {
    // 监听beforeinstallprompt事件
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA install prompt available')
      // 阻止默认的安装提示
      e.preventDefault()
      // 保存事件以供后续使用
      this.deferredPrompt = e
      // 通知所有监听器可以安装
      this.notifyInstallPromptListeners(true)
    })

    // 监听PWA安装完成事件
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
      // 清除缓存的提示事件
      this.deferredPrompt = null
      // 通知监听器已安装
      this.notifyInstallPromptListeners(false)
    })
  }

  // 检测是否在PWA模式下运行
  isPWAMode(): boolean {
    // 方法1: 检查display-mode媒体查询
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true
    }

    // 方法2: iOS Safari检查
    if (window.navigator.standalone === true) {
      return true
    }

    // 方法3: 检查referrer（从桌面启动时通常为空）
    if (document.referrer === "" && window.location.href !== window.location.origin + "/") {
      return true
    }

    return false
  }

  // 检测是否可以安装PWA
  canInstallPWA(): boolean {
    // 如果已经在PWA模式下，则不需要安装
    if (this.isPWAMode()) {
      return false
    }

    // 如果有缓存的安装提示事件，则可以安装
    return this.deferredPrompt !== null
  }

  // 执行PWA安装
  async installPWA(): Promise<{ success: boolean; outcome?: string }> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available')
      return { success: false }
    }

    try {
      // 显示安装提示
      await this.deferredPrompt.prompt()
      
      // 等待用户响应
      const choiceResult = await this.deferredPrompt.userChoice
      
      console.log(`PWA install choice: ${choiceResult.outcome}`)
      
      if (choiceResult.outcome === 'accepted') {
        // 用户接受安装
        this.deferredPrompt = null
        this.notifyInstallPromptListeners(false)
        return { success: true, outcome: 'accepted' }
      } else {
        // 用户拒绝安装
        return { success: false, outcome: 'dismissed' }
      }
      
    } catch (error) {
      console.error('PWA install failed:', error)
      return { success: false }
    }
  }

  // 添加安装提示监听器
  onInstallPromptChange(callback: (canInstall: boolean) => void) {
    this.installPromptListeners.push(callback)
    
    // 立即调用一次以获取当前状态
    callback(this.canInstallPWA())
    
    // 返回取消监听的函数
    return () => {
      const index = this.installPromptListeners.indexOf(callback)
      if (index > -1) {
        this.installPromptListeners.splice(index, 1)
      }
    }
  }

  // 通知所有安装提示监听器
  private notifyInstallPromptListeners(canInstall: boolean) {
    this.installPromptListeners.forEach(callback => {
      try {
        callback(canInstall)
      } catch (error) {
        console.error('Error in install prompt listener:', error)
      }
    })
  }

  // 获取PWA安装状态信息
  getInstallStatus() {
    return {
      isPWAMode: this.isPWAMode(),
      canInstall: this.canInstallPWA(),
      hasPrompt: this.deferredPrompt !== null
    }
  }
}

// 导出单例实例
export const pwaService = PWAService.getInstance()
