import { useAppInitialization } from '@/hooks/useAppInitialization'
import LoadingProgress from '@/components/LoadingProgress'
import HomePage from '@/pages/HomePage'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'

function App() {
  const { isAppReady } = useAppInitialization()

  return (
    <>
      {/* 主屏幕始终渲染 */}
      <HomePage />
      
      {/* PWA安装提示 */}
      <PWAInstallPrompt />
      
      {/* PWA更新提示 */}
      <PWAUpdatePrompt />
      
      {/* 加载屏作为叠加层 */}
      <LoadingProgress visible={!isAppReady} />
    </>
  )
}

export default App
