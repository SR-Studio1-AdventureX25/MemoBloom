import { memo, useEffect, useState } from "react";
import type { WateringRecord } from "@/types";

// 样式常量
const MODAL_STYLES = {
  background: 'rgba(0, 0, 0, 0.75)',
  fontFamily: '"DingTalk JinBuTi", serif',
  animationDuration: '300ms'
};

const CARD_STYLES = {
  background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.9), rgba(160, 82, 45, 0.8))',
  border: '2px solid rgba(218, 165, 32, 0.6)',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)'
};

const TEXT_SHADOW = '2px 2px 4px rgba(0, 0, 0, 0.8)';

// 记忆抽取详情弹窗组件 - 卡片式布局
export const MemoryDrawModal = memo(function ({
  audioRecord, 
  isOpen, 
  onClose
}: {
  audioRecord: WateringRecord | null, 
  isOpen: boolean, 
  onClose: () => void
}) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    console.log('handleClose called, isClosing:', isClosing, 'isOpen:', isOpen);
    if (isClosing) return;
    
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 添加键盘ESC关闭功能
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isClosing]);

  if (!audioRecord) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
      style={{ 
        fontFamily: MODAL_STYLES.fontFamily,
        backgroundColor: MODAL_STYLES.background,
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
    >
      {/* 主卡片容器 */}
      <div 
        className={`w-full max-w-md rounded-3xl p-6 transform transition-all duration-300 ${
          isOpen && !isClosing ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={CARD_STYLES}
      >
        {/* 标题区域 */}
        <div className="text-center mb-6 pb-4 border-b border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-300 mb-2" style={{ textShadow: TEXT_SHADOW }}>
            🏆 记忆成就获得 🏆
          </div>
        </div>

        {/* NFT状态区域 */}
        <div className="text-center mb-6 pb-4 border-b border-yellow-500/30">
          <div className="text-lg font-bold text-yellow-200" style={{ textShadow: TEXT_SHADOW }}>
            {audioRecord.nftMinted ? "✨ 珍藏版记忆唱片" : "🌸 开花记忆抽取"}
          </div>
        </div>

        {/* 核心事件区域 */}
        <div className="mb-6 pb-4 border-b border-yellow-500/30">
          <div className="text-yellow-200 text-base font-bold mb-3" style={{ textShadow: TEXT_SHADOW }}>
            📖 核心事件
          </div>
          <div className="text-yellow-100 text-lg font-medium leading-relaxed" style={{ textShadow: TEXT_SHADOW }}>
            {audioRecord.coreEvent}
          </div>
        </div>
        
        {/* 情感标签区域 */}
        <div className="mb-6 pb-4 border-b border-yellow-500/30">
          <div className="text-yellow-200 text-base font-bold mb-3" style={{ textShadow: TEXT_SHADOW }}>
            💭 情感标签
          </div>
          <div className="flex flex-wrap gap-2">
            {audioRecord.emotionTags?.map((tag, index) => (
              <span 
                key={index} 
                className="px-3 py-1 text-sm font-medium rounded-full"
                style={{
                  background: 'linear-gradient(45deg, #DAA520, #FFD700)',
                  color: '#8B4513',
                  textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
                  border: '1px solid #B8860B',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              >
                {tag}
              </span>
            )) || (
              <span className="text-yellow-400 text-sm">暂无标签</span>
            )}
          </div>
        </div>

        {/* 记录时间区域 */}
        <div className="text-center">
          <div className="text-yellow-200 text-base font-bold mb-2" style={{ textShadow: TEXT_SHADOW }}>
            ⏰ 记录时间
          </div>
          <div className="text-yellow-100 text-sm" style={{ textShadow: TEXT_SHADOW }}>
            {new Date(audioRecord.wateringTime).toLocaleString('zh-CN')}
          </div>
        </div>

        {/* 关闭按钮和提示 */}
        <div className="text-center mt-6 pt-4 border-t border-yellow-500/30">
          <button
            onClick={handleClose}
            className="mb-3 px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(45deg, #DAA520, #FFD700)',
              color: '#8B4513',
              textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)',
              border: '1px solid #B8860B',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            关闭
          </button>
          <div className="text-yellow-400 text-xs opacity-75" style={{ textShadow: TEXT_SHADOW }}>
            点击任意位置或按ESC键关闭
          </div>
        </div>
      </div>
    </div>
  );
});
