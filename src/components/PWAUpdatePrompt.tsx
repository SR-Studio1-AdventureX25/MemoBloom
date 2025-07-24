import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // 监听Service Worker更新
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)
        
        // 监听Service Worker状态变化
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 有新版本可用
                setShowUpdatePrompt(true)
              }
            })
          }
        })
      })

      // 监听Service Worker控制权变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // 新的Service Worker已经激活，刷新页面
        window.location.reload()
      })
    }
  }, [])

  const handleUpdate = async () => {
    if (registration && registration.waiting) {
      // 告诉等待中的Service Worker跳过等待并激活
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setShowUpdatePrompt(false)
    }
  }

  const handleLater = () => {
    setShowUpdatePrompt(false)
  }

  return (
    <Dialog open={showUpdatePrompt} onOpenChange={setShowUpdatePrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🚀 应用更新
          </DialogTitle>
          <DialogDescription>
            发现新版本！更新包含新功能和错误修复，建议立即更新以获得最佳体验。
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleLater} className="w-full sm:w-auto">
            稍后更新
          </Button>
          <Button onClick={handleUpdate} className="w-full sm:w-auto">
            立即更新
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
