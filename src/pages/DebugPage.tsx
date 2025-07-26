import { useState, useEffect } from 'react'
import { pwaService } from '@/services/pwa'
import { useAppStore } from '@/store'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export default function DebugPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [pwaStatus, setPwaStatus] = useState({
    isPWAMode: false,
    canInstall: false,
    hasPrompt: false,
    isMobilePWA: false,
    notificationMethod: 'unknown'
  })
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('checking...')
  
  const { addNotification, isOnline } = useAppStore()

  // 添加日志条目
  const addLog = (level: LogEntry['level'], message: string) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    }
    setLogs(prev => [newLog, ...prev.slice(0, 49)]) // 保持最新50条
  }

  // 检查系统状态
  const checkSystemStatus = async () => {
    addLog('info', '开始检查系统状态...')
    
    // 检查通知权限
    const permission = pwaService.getNotificationPermission()
    setNotificationPermission(permission)
    addLog('info', `通知权限状态: ${permission}`)
    
    // 检查PWA状态
    const status = pwaService.getInstallStatus()
    setPwaStatus(status)
    addLog('info', `PWA模式: ${status.isPWAMode}, 可安装: ${status.canInstall}`)
    addLog('info', `移动PWA: ${status.isMobilePWA}, 通知方法: ${status.notificationMethod}`)
    
    // 详细的PWA检测信息
    const standaloneMatch = window.matchMedia('(display-mode: standalone)').matches
    const fullscreenMatch = window.matchMedia('(display-mode: fullscreen)').matches
    const iosStandalone = window.navigator.standalone === true
    const urlParams = new URLSearchParams(window.location.search)
    const hasPwaParam = urlParams.get('source') === 'pwa'
    
    addLog('info', `检测详情 - standalone: ${standaloneMatch}, fullscreen: ${fullscreenMatch}`)
    addLog('info', `检测详情 - iOS standalone: ${iosStandalone}, PWA参数: ${hasPwaParam}`)
    addLog('info', `检测详情 - referrer: "${document.referrer}", pathname: "${window.location.pathname}"`)
    
    // 检查Service Worker状态
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready
        setServiceWorkerStatus('已注册并激活')
        addLog('success', 'Service Worker 状态正常')
      } catch (error) {
        setServiceWorkerStatus('注册失败')
        addLog('error', `Service Worker 错误: ${error}`)
      }
    } else {
      setServiceWorkerStatus('不支持')
      addLog('warning', '浏览器不支持 Service Worker')
    }
    
    addLog('success', '系统状态检查完成')
  }

  // 请求通知权限
  const requestNotificationPermission = async () => {
    addLog('info', '请求通知权限...')
    try {
      const permission = await pwaService.requestNotificationPermission()
      setNotificationPermission(permission)
      addLog('success', `通知权限已${permission === 'granted' ? '授予' : '拒绝'}`)
    } catch (error) {
      addLog('error', `请求权限失败: ${error}`)
    }
  }

  // 测试基础通知
  const testBasicNotification = async () => {
    addLog('info', '发送基础通知测试...')
    try {
      await pwaService.sendLocalNotification('测试通知', {
        body: '这是一个测试通知，用于验证通知功能是否正常工作',
        icon: '/pwa-192x192.png',
        tag: 'test-notification'
      })
      addLog('success', '基础通知发送成功')
    } catch (error) {
      addLog('error', `基础通知发送失败: ${error}`)
    }
  }

  // 测试应用内通知
  const testAppNotification = () => {
    addLog('info', '发送应用内通知测试...')
    try {
      addNotification({
        title: '应用内通知测试',
        message: '这是一个应用内通知，会同时触发PWA通知',
        type: 'info',
        read: false
      })
      addLog('success', '应用内通知发送成功')
    } catch (error) {
      addLog('error', `应用内通知发送失败: ${error}`)
    }
  }

  // 测试植物通知
  const testPlantNotification = async () => {
    addLog('info', '发送植物通知测试...')
    try {
      await pwaService.sendPlantNotification('测试植物', '这是一个植物浇水提醒测试', 'watering')
      addLog('success', '植物通知发送成功')
    } catch (error) {
      addLog('error', `植物通知发送失败: ${error}`)
    }
  }

  // 测试成就通知
  const testAchievementNotification = async () => {
    addLog('info', '发送成就通知测试...')
    try {
      await pwaService.sendAchievementNotification('测试成就', '恭喜你完成了通知功能测试！')
      addLog('success', '成就通知发送成功')
    } catch (error) {
      addLog('error', `成就通知发送失败: ${error}`)
    }
  }

  // 测试不同类型的通知
  const testNotificationTypes = async () => {
    const types = [
      { type: 'success', title: '成功通知', message: '操作成功完成' },
      { type: 'warning', title: '警告通知', message: '请注意这个警告信息' },
      { type: 'error', title: '错误通知', message: '发生了一个错误' },
      { type: 'info', title: '信息通知', message: '这是一条普通信息' }
    ]

    for (const notif of types) {
      addLog('info', `发送${notif.type}类型通知...`)
      try {
        addNotification({
          title: notif.title,
          message: notif.message,
          type: notif.type as 'success' | 'warning' | 'error' | 'info',
          read: false
        })
        await new Promise(resolve => setTimeout(resolve, 1000)) // 间隔1秒
      } catch (error) {
        addLog('error', `${notif.type}通知发送失败: ${error}`)
      }
    }
    addLog('success', '所有类型通知测试完成')
  }

  // 清空日志
  const clearLogs = () => {
    setLogs([])
    addLog('info', '日志已清空')
  }

  // 页面加载时检查状态
  useEffect(() => {
    checkSystemStatus()
  }, [])

  const getPermissionColor = (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted': return 'text-green-600'
      case 'denied': return 'text-red-600'
      default: return 'text-yellow-600'
    }
  }

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">🔧 通知功能调试页面</h1>
          
          {/* 系统状态区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">📊 系统状态</h2>
              <div className="space-y-2 text-sm">
                <div>通知权限: <span className={getPermissionColor(notificationPermission)}>{notificationPermission}</span></div>
                <div>Service Worker: <span className="text-blue-600">{serviceWorkerStatus}</span></div>
                <div>网络状态: <span className={isOnline ? 'text-green-600' : 'text-red-600'}>{isOnline ? '在线' : '离线'}</span></div>
                <div>PWA模式: <span className={pwaStatus.isPWAMode ? 'text-green-600' : 'text-gray-600'}>{pwaStatus.isPWAMode ? '是' : '否'}</span></div>
                <div>移动PWA: <span className={pwaStatus.isMobilePWA ? 'text-orange-600' : 'text-gray-600'}>{pwaStatus.isMobilePWA ? '是' : '否'}</span></div>
                <div>通知方法: <span className="text-purple-600">{pwaStatus.notificationMethod}</span></div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">🌐 浏览器信息</h2>
              <div className="space-y-2 text-sm">
                <div>用户代理: <span className="text-gray-600 text-xs">{navigator.userAgent.slice(0, 50)}...</span></div>
                <div>支持通知: <span className={'Notification' in window ? 'text-green-600' : 'text-red-600'}>{'Notification' in window ? '是' : '否'}</span></div>
                <div>支持SW: <span className={'serviceWorker' in navigator ? 'text-green-600' : 'text-red-600'}>{'serviceWorker' in navigator ? '是' : '否'}</span></div>
              </div>
            </div>
          </div>

          {/* 测试按钮区域 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">🧪 通知测试</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <button
                onClick={requestNotificationPermission}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                请求权限
              </button>
              
              <button
                onClick={testBasicNotification}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                disabled={notificationPermission !== 'granted'}
              >
                基础通知
              </button>
              
              <button
                onClick={testAppNotification}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                应用内通知
              </button>
              
              <button
                onClick={testPlantNotification}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                disabled={notificationPermission !== 'granted'}
              >
                植物通知
              </button>
              
              <button
                onClick={testAchievementNotification}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                disabled={notificationPermission !== 'granted'}
              >
                成就通知
              </button>
              
              <button
                onClick={testNotificationTypes}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                批量测试
              </button>
              
              <button
                onClick={checkSystemStatus}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                刷新状态
              </button>
              
              <button
                onClick={clearLogs}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                清空日志
              </button>
            </div>
          </div>

          {/* 日志输出区域 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">📝 调试日志</h2>
            <div className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">暂无日志...</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="mb-1">
                    <span className="text-gray-400">[{log.timestamp}]</span>
                    <span className={`ml-2 ${getLogColor(log.level)}`}>
                      {log.level.toUpperCase()}:
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 返回按钮 */}
          <div className="mt-6 text-center">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              返回应用
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
