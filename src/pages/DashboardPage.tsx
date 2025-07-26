import { useState } from 'react'

const DashboardPage = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Loading状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 text-sm">加载仪表板中...</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-gray-800 text-lg font-semibold mb-2">加载失败</h3>
            <p className="text-gray-600 text-sm">无法加载仪表板内容</p>
          </div>
        </div>
      )}

      {/* 飞书仪表板iframe */}
      <iframe
        src="https://dcnarzvja2a2.feishu.cn/share/base/dashboard/shrcnUVyos5Afhdg7pdrHu7OqKg"
        className="w-full h-full border-none"
        title="飞书仪表板"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />

      {/* 顶部遮罩，确保header完全被隐藏 - 使用白色背景匹配iframe */}
      {/* <div 
        className="absolute top-0 left-0 right-0 bg-white pointer-events-none z-5"
        style={{ height: '60px' }}
      /> */}
    </div>
  )
}

export default DashboardPage
