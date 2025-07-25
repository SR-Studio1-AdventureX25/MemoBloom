import { useState, useEffect } from 'react'

interface LoadingProgressProps {
  // 显示控制
  visible?: boolean // 是否可见，默认 true
}

export default function LoadingProgress({ 
  visible = true
}: LoadingProgressProps) {
  // 内部状态管理渲染和透明度
  const [shouldRender, setShouldRender] = useState(visible)
  const [opacity, setOpacity] = useState(visible ? 1 : 0)

  // 监听 visible 属性变化，控制淡入淡出
  useEffect(() => {
    if (visible) {
      // 显示：立即渲染，然后淡入
      setShouldRender(true)
      // 使用 requestAnimationFrame 确保渲染完成后再设置透明度
      requestAnimationFrame(() => {
        setOpacity(1)
      })
    } else {
      // 隐藏：先淡出，然后停止渲染
      setOpacity(0)
      // 等待淡出动画完成后再停止渲染
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 500) // 与 CSS transition 时间保持一致
      
      return () => clearTimeout(timer)
    }
  }, [visible])

  // 如果不应该渲染，直接返回 null
  if (!shouldRender) {
    return null
  }

  return (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center z-50 transition-opacity duration-500 ease-out"
      style={{ opacity }}
    >
      {/* 背景动画 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20">
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center px-8 py-12 max-w-md w-full mx-auto">
        {/* Logo 或图标 */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full p-1 shadow-2xl">
            <img 
              src="/pwa-192x192.png" 
              alt="MemoBloom Logo" 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          MemoBloom
        </h1>
        
        {/* 副标题 */}
        <p className="text-gray-300 text-center mb-8">
          正在加载游戏资源...
        </p>

        {/* 加载动画 */}
        <div className="w-full">
          {/* 加载动画圆环 */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-green-400 rounded-full animate-spin"></div>
          </div>

          {/* 状态文本 */}
          <div className="text-center">
            <span className="text-gray-400 text-sm">
              正在初始化应用...
            </span>
          </div>
        </div>

        {/* 加载提示 */}
        <div className="mt-8 flex items-center justify-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
          <span className="ml-3 text-gray-400 text-sm">
            请耐心等待
          </span>
        </div>

        {/* 小贴士 */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            首次启动需要下载游戏资源
          </p>
          <p className="text-gray-500 text-xs mt-1">
            后续启动将会更快
          </p>
        </div>
      </div>

      {/* 装饰性背景元素 */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-400/10 rounded-full blur-xl" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-400/10 rounded-full blur-xl" />
      <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-purple-400/10 rounded-full blur-xl" />
    </div>
  )
}
