import { useState } from 'react'

interface MnemonicDisplayProps {
  mnemonic: string
  onConfirm?: () => void
  showConfirmButton?: boolean
  title?: string
  description?: string
  blur?: boolean
  showNumbers?: boolean
}

const MnemonicDisplay = ({
  mnemonic,
  onConfirm,
  showConfirmButton = false,
  title = '助记词',
  description = '请安全备份您的助记词，这是恢复钱包的唯一方式',
  blur = false,
  showNumbers = true
}: MnemonicDisplayProps) => {
  const [isRevealed, setIsRevealed] = useState(!blur)
  const [currentPage, setCurrentPage] = useState(0)

  const words = mnemonic.trim().split(' ').filter(word => word.length > 0)
  const wordsPerPage = 4 // 每页显示4个单词
  const totalPages = Math.ceil(words.length / wordsPerPage)
  
  const getCurrentPageWords = () => {
    const startIndex = currentPage * wordsPerPage
    const endIndex = startIndex + wordsPerPage
    return words.slice(startIndex, endIndex).map((word, index) => ({
      word,
      originalIndex: startIndex + index
    }))
  }

  const toggleReveal = () => {
    setIsRevealed(!isRevealed)
  }

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 标题和描述 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/70 text-sm">{description}</p>
      </div>

      {/* 安全警告 */}
      <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="text-red-400 text-xl">⚠️</div>
          <div>
            <h3 className="text-red-400 font-semibold text-sm mb-1">安全提醒</h3>
            <ul className="text-red-200 text-xs space-y-1">
              <li>• 请在安全的环境下备份助记词</li>
              <li>• 不要截图或拍照保存</li>
              <li>• 不要通过网络传输或存储</li>
              <li>• 任何人获得助记词都能控制您的资产</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 助记词分段显示 */}
      <div className="relative">
        {/* 模糊遮罩 */}
        {blur && !isRevealed && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <button
              onClick={toggleReveal}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg backdrop-blur-sm transition-all duration-200 flex items-center space-x-2"
            >
              <span>👁️</span>
              <span>点击显示助记词</span>
            </button>
          </div>
        )}

        {/* 页面指示器 */}
        <div className="flex justify-center items-center mb-4">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentPage ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
          <div className="ml-4 text-white/60 text-sm">
            {currentPage + 1} / {totalPages}
          </div>
        </div>

        {/* 当前页助记词 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {getCurrentPageWords().map(({ word, originalIndex }) => (
            <div
              key={originalIndex}
              className="bg-white/10 border border-white/20 rounded-lg p-3 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-2">
                {showNumbers && (
                  <span className="text-white/50 text-sm font-mono w-6">
                    {originalIndex + 1}.
                  </span>
                )}
                <span className="text-white font-medium font-mono">
                  {word}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 分页导航 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-2"
          >
            <span>←</span>
            <span>上一页</span>
          </button>

          <div className="text-white/60 text-sm">
            请逐页记录所有助记词
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center space-x-2"
          >
            <span>下一页</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        {blur && (
          <button
            onClick={toggleReveal}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
          >
            <span>{isRevealed ? '🙈' : '👁️'}</span>
            <span>{isRevealed ? '隐藏助记词' : '显示助记词'}</span>
          </button>
        )}

        {showConfirmButton && onConfirm && (
          <button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold"
          >
            我已安全备份助记词
          </button>
        )}
      </div>

      {/* 安全提示信息 */}
      <div className="mt-4 text-center text-white/50 text-xs">
        <div className="mb-1">🔒 为了您的资产安全，已禁用复制功能</div>
        <div>请手动记录助记词到安全的地方</div>
      </div>
    </div>
  )
}

export default MnemonicDisplay
