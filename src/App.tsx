import { useAppInitialization } from '@/hooks/useAppInitialization'
import LoadingProgress from '@/components/LoadingProgress'
import HomePage from '@/pages/HomePage'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'
import { createHashRouter, RouterProvider } from 'react-router'

const router = createHashRouter([
  {
    path: '/',
    element: <HomePage />
  }
]);

function App() {
  const { isAppReady } = useAppInitialization()

  return (
    <>
      {/* 路由提供者 */}
      <RouterProvider router={router}></RouterProvider>
      
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
