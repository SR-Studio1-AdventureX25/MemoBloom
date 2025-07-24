import { useEffect } from 'react'
import { pwaService } from '@/services/pwa'
import {createHashRouter, RouterProvider} from "react-router"
import PWAInstallPrompt from '@/components/PWAInstallPrompt'

const router = createHashRouter([
  {
    path: '/',
    element: <div>Hello world</div>
  }
]);

function App() {
  useEffect(() => {
    // 初始化PWA服务
    pwaService.init()
  }, [])

  return (
    <>
      <RouterProvider router={router}></RouterProvider>
      {/* PWA安装提示 */}
      <PWAInstallPrompt />
    </>
  )
}

export default App
