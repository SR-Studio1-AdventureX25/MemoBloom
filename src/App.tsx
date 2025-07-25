import { useAppInitialization } from '@/hooks/useAppInitialization'
import LoadingProgress from '@/components/LoadingProgress'
import HomePage from '@/pages/HomePage'
import CreatePlant from '@/pages/CreatePlant'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'
import { createHashRouter, RouterProvider, Navigate, useNavigate } from 'react-router'
import { useAppStore } from '@/store'
import type { Plant } from '@/types'

// 根路由组件 - 检查是否有当前植物
function RootRoute() {
  const { currentPlantId, plants } = useAppStore()
  
  // 如果没有当前植物ID或者植物列表为空，导航到创建植物页面
  if (!currentPlantId || plants.length === 0) {
    return <Navigate to="/createplant" replace />
  }
  
  // 有植物则显示主页
  return <HomePage />
}

// CreatePlant 路由包装组件
function CreatePlantRoute() {
  const navigate = useNavigate()
  const { setCurrentPlantId, addNotification } = useAppStore()
  
  const handlePlantCreated = (plant: Plant) => {
    // 设置当前植物ID
    setCurrentPlantId(plant.id)
    
    // 添加成功通知
    addNotification({
      title: '植物创建成功',
      message: `你的${plant.variety}已经开始成长了！`,
      type: 'success',
      read: false
    })
    
    // 导航到主页
    navigate('/', { replace: true })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900">
      <CreatePlant onPlantCreated={handlePlantCreated} />
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <RootRoute />
  },
  {
    path: '/createplant',
    element: <CreatePlantRoute />
  }
]);

function App() {
  const { isAppReady } = useAppInitialization()

  return (
    <>
      {/* 只有当应用准备好时才渲染路由 */}
      {isAppReady && <RouterProvider router={router} />}
      
      {/* PWA安装提示 */}
      <PWAInstallPrompt />
      
      {/* PWA更新提示 */}
      <PWAUpdatePrompt />
      
      {/* 加载屏，延迟200毫秒消失 */}
      <LoadingProgress visible={!isAppReady} />
    </>
  )
}

export default App
