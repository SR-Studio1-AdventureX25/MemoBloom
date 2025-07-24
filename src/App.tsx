import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { pwaService } from '@/services/pwa'

function App() {
  useEffect(() => {
    // 初始化PWA服务
    pwaService.init()
  }, [])

  return <></>
}

export default App
