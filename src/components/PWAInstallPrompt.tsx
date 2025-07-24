import { useState, useEffect } from 'react'
import { Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { pwaService } from '@/services/pwa'

interface PWAInstallPromptProps {
  className?: string
}

export function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // 检查是否已经手动关闭过以及关闭时间
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time')
    if (dismissedTime) {
      const dismissedTimestamp = parseInt(dismissedTime)
      const now = Date.now()
      const timeSinceDismissed = now - dismissedTimestamp
      
      // 如果关闭时间少于24小时，则保持关闭状态
      if (timeSinceDismissed < 24 * 60 * 60 * 1000) {
        setIsDismissed(true)
        return
      } else {
        // 超过24小时，清除记录
        localStorage.removeItem('pwa-install-dismissed-time')
      }
    }

    // 监听安装状态变化
    const unsubscribe = pwaService.onInstallPromptChange((installable) => {
      // 延迟显示，避免页面加载时立即弹出
      if (installable && !isDismissed) {
        setTimeout(() => setIsOpen(true), 2000)
      } else {
        setIsOpen(false)
      }
    })

    return unsubscribe
  }, [isDismissed])

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const result = await pwaService.installPWA()
      if (result.success) {
        setIsOpen(false)
        // 可以显示成功消息
        console.log('PWA安装成功')
      } else if (result.outcome === 'dismissed') {
        // 用户拒绝了安装
        handleDismiss()
      }
    } catch (error) {
      console.error('安装失败:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsOpen(false)
    setIsDismissed(true)
    // 记录关闭时间戳
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString())
  }

  const handleLater = () => {
    setIsOpen(false)
    // 30分钟后重新显示
    setTimeout(() => {
      if (pwaService.canInstallPWA()) {
        setIsOpen(true)
      }
    }, 30 * 60 * 1000) // 30分钟
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleDismiss() // 用户通过ESC键或点击遮罩关闭时，视为关闭
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={`sm:max-w-md ${className}`} showCloseButton={false}>
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <DialogTitle className="text-xl font-bold">
            安装植忆应用
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            将应用添加到主屏幕，享受更好的使用体验：
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>离线访问，无需网络连接</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>全屏体验，如原生应用</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>快速启动，直接从桌面打开</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {isInstalling ? '安装中...' : '立即安装'}
          </Button>
          
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleLater}
              className="flex-1"
            >
              稍后提醒
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="flex-1"
            >
              不再提示
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PWAInstallPrompt
