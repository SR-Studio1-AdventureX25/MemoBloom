import { memo } from 'react'

interface BloomBudProps {
  index: number
  onClick: () => void
  disabled?: boolean
}

export const BloomBud = memo<BloomBudProps>(({ index, onClick, disabled = false }) => {
  return (
    <div 
      className={`relative cursor-pointer transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
      }`}
      onClick={disabled ? undefined : onClick}
      style={{
        animationDelay: `${index * 0.5}s` // 错开动画时机
      }}
    >
      {/* 花苞SVG */}
      <div className={`bloom-bud ${disabled ? '' : 'animate-bounce-gentle'}`}>
        <svg 
          width="60" 
          height="80" 
          viewBox="0 0 60 80" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* 花苞主体 */}
          <ellipse 
            cx="30" 
            cy="35" 
            rx="25" 
            ry="30" 
            fill="url(#budGradient)"
            stroke="url(#budStroke)"
            strokeWidth="2"
          />
          
          {/* 花苞顶部细节 */}
          <path 
            d="M15 25 Q30 15 45 25 Q30 20 15 25" 
            fill="url(#budHighlight)"
            opacity="0.7"
          />
          
          {/* 花茎 */}
          <rect 
            x="27" 
            y="60" 
            width="6" 
            height="18" 
            rx="3" 
            fill="url(#stemGradient)"
          />
          
          {/* 叶子 */}
          <ellipse 
            cx="20" 
            cy="68" 
            rx="8" 
            ry="4" 
            fill="url(#leafGradient)"
            transform="rotate(-30 20 68)"
          />
          <ellipse 
            cx="40" 
            cy="72" 
            rx="8" 
            ry="4" 
            fill="url(#leafGradient)"
            transform="rotate(30 40 72)"
          />
          
          {/* 渐变定义 */}
          <defs>
            <linearGradient id="budGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF69B4" />
              <stop offset="50%" stopColor="#FF1493" />
              <stop offset="100%" stopColor="#DC143C" />
            </linearGradient>
            
            <linearGradient id="budStroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF1493" />
              <stop offset="100%" stopColor="#8B0000" />
            </linearGradient>
            
            <linearGradient id="budHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFB6C1" />
              <stop offset="100%" stopColor="#FF69B4" />
            </linearGradient>
            
            <linearGradient id="stemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#90EE90" />
              <stop offset="100%" stopColor="#228B22" />
            </linearGradient>
            
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#98FB98" />
              <stop offset="100%" stopColor="#32CD32" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* 发光效果 */}
      {!disabled && (
        <div 
          className="absolute inset-0 rounded-full opacity-30 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255, 105, 180, 0.4) 0%, transparent 70%)',
            filter: 'blur(8px)',
            transform: 'scale(1.2)'
          }}
        />
      )}
      
      {/* 点击提示 */}
      {!disabled && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 text-xs text-center whitespace-nowrap">
          点击抽取记忆
        </div>
      )}
    </div>
  )
})

BloomBud.displayName = 'BloomBud'
