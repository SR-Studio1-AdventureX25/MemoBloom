import { useState, useRef, useEffect } from 'react'

interface PinInputProps {
  length?: number
  value: string
  onChange: (pin: string) => void
  onComplete?: (pin: string) => void
  disabled?: boolean
  error?: boolean
  placeholder?: string
}

const PinInput = ({ 
  length = 6, 
  value, 
  onChange, 
  onComplete, 
  disabled = false, 
  error = false,
  placeholder = '请输入PIN码'
}: PinInputProps) => {
  const [pins, setPins] = useState<string[]>(Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 同步外部value到内部state
  useEffect(() => {
    const newPins = value.padEnd(length, '').split('').slice(0, length)
    setPins(newPins)
  }, [value, length])

  // PIN码完成时的回调
  useEffect(() => {
    const currentPin = pins.join('')
    if (currentPin.length === length && onComplete) {
      onComplete(currentPin)
    }
  }, [pins, length, onComplete])

  const handleInputChange = (index: number, inputValue: string) => {
    // 只允许数字输入
    if (!/^\d*$/.test(inputValue)) return

    const newPins = [...pins]
    
    if (inputValue.length > 1) {
      // 处理粘贴多个字符的情况
      const pastedDigits = inputValue.slice(0, length - index).split('')
      pastedDigits.forEach((digit, i) => {
        if (index + i < length) {
          newPins[index + i] = digit
        }
      })
      
      // 焦点移动到最后一个填充的位置或下一个空位置
      const nextIndex = Math.min(index + pastedDigits.length, length - 1)
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus()
      }, 0)
    } else {
      newPins[index] = inputValue
      
      // 自动跳转到下一个输入框
      if (inputValue && index < length - 1) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus()
        }, 0)
      }
    }

    setPins(newPins)
    onChange(newPins.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      // 如果当前输入框为空且按退格键，跳转到前一个输入框
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus()
      }, 0)
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setTimeout(() => {
        inputRefs.current[index - 1]?.focus()
      }, 0)
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus()
      }, 0)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)
    
    if (pastedData) {
      const newPins = Array(length).fill('')
      pastedData.split('').forEach((digit, index) => {
        if (index < length) {
          newPins[index] = digit
        }
      })
      
      setPins(newPins)
      onChange(newPins.join(''))
      
      // 焦点移动到最后一个位置
      const lastIndex = Math.min(pastedData.length - 1, length - 1)
      setTimeout(() => {
        inputRefs.current[lastIndex]?.focus()
      }, 0)
    }
  }

  const clearPin = () => {
    const newPins = Array(length).fill('')
    setPins(newPins)
    onChange('')
    setTimeout(() => {
      inputRefs.current[0]?.focus()
    }, 0)
  }

  return (
    <div className="w-full">
      <div className="flex justify-center items-center space-x-3 mb-4">
        {pins.map((pin, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={pin}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-12 h-12 text-center text-xl font-bold border-2 rounded-lg
              transition-all duration-200 focus:outline-none
              ${error 
                ? 'border-red-400 bg-red-50 text-red-600' 
                : 'border-white/30 bg-white/10 text-white focus:border-purple-400 focus:bg-white/20'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}
              backdrop-blur-sm
            `}
            placeholder=""
          />
        ))}
      </div>
      
      {/* 清除按钮 */}
      {value && !disabled && (
        <div className="flex justify-center">
          <button
            onClick={clearPin}
            className="text-white/60 hover:text-white text-sm transition-colors duration-200"
          >
            清除
          </button>
        </div>
      )}
      
      {/* 占位符提示 */}
      {!value && placeholder && (
        <div className="text-center text-white/50 text-sm mt-2">
          {placeholder}
        </div>
      )}
    </div>
  )
}

export default PinInput
