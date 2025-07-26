import { useState } from 'react'
import { injectiveWallet } from '@/services/injectiveWallet'

interface MnemonicImportProps {
  onImportComplete: (mnemonic: string) => void
  onCancel: () => void
}

const MnemonicImport = ({ onImportComplete, onCancel }: MnemonicImportProps) => {
  const [words, setWords] = useState<string[]>(Array(12).fill(''))
  const [suggestions, setSuggestions] = useState<string[][]>(Array(12).fill([]))
  const [errors, setErrors] = useState<boolean[]>(Array(12).fill(false))
  const [isValidating, setIsValidating] = useState(false)
  const [globalError, setGlobalError] = useState('')

  // 验证单个单词
  const validateWord = (word: string, index: number) => {
    if (!word.trim()) {
      return true // 空单词暂时不标记为错误
    }
    
    const isValid = injectiveWallet.isValidMnemonicWord(word.trim())
    const newErrors = [...errors]
    newErrors[index] = !isValid
    setErrors(newErrors)
    
    return isValid
  }

  // 获取单词建议
  const getSuggestions = (prefix: string, index: number) => {
    if (prefix.length < 2) {
      const newSuggestions = [...suggestions]
      newSuggestions[index] = []
      setSuggestions(newSuggestions)
      return
    }

    const wordSuggestions = injectiveWallet.getMnemonicSuggestions(prefix)
    const newSuggestions = [...suggestions]
    newSuggestions[index] = wordSuggestions
    setSuggestions(newSuggestions)
  }

  // 处理单词输入
  const handleWordChange = (index: number, value: string) => {
    const cleanValue = value.toLowerCase().trim()
    const newWords = [...words]
    newWords[index] = cleanValue
    setWords(newWords)

    // 清除全局错误
    setGlobalError('')

    // 验证单词
    validateWord(cleanValue, index)

    // 获取建议
    getSuggestions(cleanValue, index)
  }

  // 选择建议的单词
  const selectSuggestion = (index: number, word: string) => {
    const newWords = [...words]
    newWords[index] = word
    setWords(newWords)

    // 清除该位置的建议
    const newSuggestions = [...suggestions]
    newSuggestions[index] = []
    setSuggestions(newSuggestions)

    // 验证选中的单词
    validateWord(word, index)

    // 自动聚焦到下一个输入框
    const nextIndex = index + 1
    if (nextIndex < 12) {
      const nextInput = document.getElementById(`word-input-${nextIndex}`)
      nextInput?.focus()
    }
  }

  // 验证完整的助记词
  const validateFullMnemonic = () => {
    setIsValidating(true)
    setGlobalError('')

    // 检查是否所有单词都已填写
    const emptyWords = words.some(word => !word.trim())
    if (emptyWords) {
      setGlobalError('请填写所有12个助记词')
      setIsValidating(false)
      return false
    }

    // 检查是否有无效单词
    const hasErrors = errors.some(error => error)
    if (hasErrors) {
      setGlobalError('请检查并修正标记为红色的无效单词')
      setIsValidating(false)
      return false
    }

    // 验证助记词格式
    const mnemonic = words.join(' ')
    const isValid = injectiveWallet.validateMnemonic(mnemonic)
    
    if (!isValid) {
      setGlobalError('助记词格式不正确，请检查单词顺序和拼写')
      setIsValidating(false)
      return false
    }

    setIsValidating(false)
    return true
  }

  // 处理导入
  const handleImport = () => {
    if (validateFullMnemonic()) {
      const mnemonic = words.join(' ')
      onImportComplete(mnemonic)
    }
  }

  // 清空所有输入
  const handleClear = () => {
    setWords(Array(12).fill(''))
    setSuggestions(Array(12).fill([]))
    setErrors(Array(12).fill(false))
    setGlobalError('')
  }

  // 粘贴助记词
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const pastedWords = text.trim().split(/\s+/).slice(0, 12)
      
      if (pastedWords.length !== 12) {
        setGlobalError('粘贴的内容应包含12个助记词')
        return
      }

      const newWords = [...words]
      const newErrors = [...errors]
      
      pastedWords.forEach((word, index) => {
        const cleanWord = word.toLowerCase().trim()
        newWords[index] = cleanWord
        newErrors[index] = !injectiveWallet.isValidMnemonicWord(cleanWord)
      })

      setWords(newWords)
      setErrors(newErrors)
      setGlobalError('')
    } catch {
      setGlobalError('无法读取剪贴板内容')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 标题 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">导入钱包</h2>
        <p className="text-white/70 text-sm">输入您的12个助记词来恢复钱包</p>
      </div>

      {/* 安全警告 */}
      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-400 text-xl">⚠️</div>
          <div>
            <h3 className="text-yellow-400 font-semibold text-sm mb-1">导入提醒</h3>
            <ul className="text-yellow-200 text-xs space-y-1">
              <li>• 确保您在安全的环境中操作</li>
              <li>• 请按正确顺序输入助记词</li>
              <li>• 助记词区分大小写，请仔细核对</li>
              <li>• 导入后请立即删除任何数字记录</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 助记词输入网格 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {words.map((word, index) => (
          <div key={index} className="relative">
            <div className="flex items-center space-x-2">
              <span className="text-white/50 text-sm font-mono w-6">
                {index + 1}.
              </span>
              <div className="flex-1 relative">
                <input
                  id={`word-input-${index}`}
                  type="text"
                  value={word}
                  onChange={(e) => handleWordChange(index, e.target.value)}
                  className={`w-full bg-white/10 border rounded-lg p-3 text-white font-mono text-sm backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 ${
                    errors[index]
                      ? 'border-red-400 focus:ring-red-400/50'
                      : 'border-white/20 focus:ring-blue-400/50'
                  }`}
                  placeholder={`单词 ${index + 1}`}
                  autoComplete="off"
                  spellCheck={false}
                />
                
                {/* 建议列表 */}
                {suggestions[index].length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-black/90 border border-white/20 rounded-lg backdrop-blur-sm max-h-32 overflow-y-auto">
                    {suggestions[index].map((suggestion, suggestionIndex) => (
                      <button
                        key={suggestionIndex}
                        onClick={() => selectSuggestion(index, suggestion)}
                        className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 transition-colors duration-200 text-sm font-mono"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 全局错误提示 */}
      {globalError && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 mb-6">
          <div className="text-red-400 text-sm">{globalError}</div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="space-y-3">
        <div className="flex space-x-3">
          <button
            onClick={handlePaste}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
          >
            <span>📋</span>
            <span>粘贴</span>
          </button>
          
          <button
            onClick={handleClear}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20 flex items-center justify-center space-x-2"
          >
            <span>🗑️</span>
            <span>清空</span>
          </button>
        </div>

        <button
          onClick={handleImport}
          disabled={isValidating}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition-all duration-200 font-semibold"
        >
          {isValidating ? '验证中...' : '导入钱包'}
        </button>

        <button
          onClick={onCancel}
          className="w-full text-white/60 hover:text-white py-2 px-4 rounded-lg transition-all duration-200"
        >
          取消
        </button>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 text-center text-white/50 text-xs">
        <div className="mb-1">💡 输入时会自动提供单词建议</div>
        <div>助记词必须按正确顺序输入</div>
      </div>
    </div>
  )
}

export default MnemonicImport
