import { useEffect } from 'react'
import { pwaService } from '@/services/pwa'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

function App() {
  useEffect(() => {
    // 初始化PWA服务
    pwaService.init()
  }, [])

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <img 
                  src="/pwa-192x192.png" 
                  alt="植忆"
                  className="h-8 w-8 mr-3"
                />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  植忆 - MemoBloom
                </h1>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {pwaService.isPWAMode() ? (
                  <span className="text-green-600 dark:text-green-400">PWA模式运行中</span>
                ) : (
                  <span>浏览器模式</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              欢迎来到植忆世界
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              一个关于植物培养的网页游戏
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-4">PWA状态</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>PWA模式:</span>
                  <span className={pwaService.isPWAMode() ? 'text-green-600' : 'text-gray-500'}>
                    {pwaService.isPWAMode() ? '是' : '否'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>可安装:</span>
                  <span className={pwaService.canInstallPWA() ? 'text-blue-600' : 'text-gray-500'}>
                    {pwaService.canInstallPWA() ? '是' : '否'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* PWA安装提示 */}
      <PWAInstallPrompt />
    </>
  )
}

export default App
