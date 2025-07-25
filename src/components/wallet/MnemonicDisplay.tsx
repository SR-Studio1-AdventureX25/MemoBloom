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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const words = mnemonic.trim().split(' ').filter(word => word.length > 0)

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      if (typeof index === 'number') {
        setCopiedIndex(index)
        setTimeout(() => setCopiedIndex(null), 2000)
      }
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const copyAllWords = () => {
    copyToClipboard(mnemonic)
  }

  const toggleReveal = () => {
    setIsRevealed(!isRevealed)
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

      {/* 助记词网格 */}
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

        <div className="grid grid-cols-2 gap-3 mb-6">
          {words.map((word, index) => (
            <div
              key={index}
              onClick={() => copyToClipboard(word, index)}
              className="bg-white/10 border border-white/20 rounded-lg p-3 cursor-pointer hover:bg-white/20 transition-all duration-200 backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {showNumbers && (
                    <span className="text-white/50 text-sm font-mono w-6">
                      {index + 1}.
                    </span>
                  )}
                  <span className="text-white font-medium font-mono">
                    {word}
                  </span>
                </div>
                
                {/* 复制状态指示 */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {copiedIndex === index ? (
                    <span className="text-green-400 text-xs">✓</span>
                  ) : (
                    <span className="text-white/50 text-xs">📋</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3">
        <div className="flex space-x-3">
          <button
            onClick={copyAllWords}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
          >
            <span>📋</span>
            <span>复制全部</span>
          </button>
          
          {blur && (
            <button
              onClick={toggleReveal}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
            >
              <span>{isRevealed ? '🙈' : '👁️'}</span>
              <span>{isRevealed ? '隐藏' : '显示'}</span>
            </button>
          )}
        </div>

        {showConfirmButton && onConfirm && (
          <button
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold"
          >
            我已安全备份助记词
          </button>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-4 text-center text-white/50 text-xs">
        点击单个助记词可复制，助记词顺序很重要
      </div>
    </div>
  )
}

export default MnemonicDisplay
