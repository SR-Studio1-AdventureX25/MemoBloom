import { memo, useEffect, useState } from "react";
import type { WateringRecord } from "@/types";

// 记忆抽取详情弹窗组件 - 游戏成就风格
export const MemoryDrawModal = memo(function ({
  audioRecord, 
  isOpen, 
  onClose
}: {
  audioRecord: WateringRecord | null, 
  isOpen: boolean, 
  onClose: () => void
}) {
  const [showContent, setShowContent] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 动画开始时隐藏内容
      setShowContent(false);
      setIsClosing(false);
      
      // 立即显示模态框，开始淡入
      setModalVisible(true);
      
      // 延迟显示内容，等待唱片动画完成
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 600); // 动画持续时间
      
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setModalVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isClosing) return; // 防止重复点击
    
    setIsClosing(true);
    setShowContent(false); // 先隐藏内容
    
    // 等待动画完成后关闭模态框
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // 始终渲染，通过CSS控制显示状态
  if (!audioRecord) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${
        modalVisible && !isClosing ? 'opacity-100' : 'opacity-0'
      } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onClick={handleClose}
      style={{ 
        fontFamily: '"DingTalk JinBuTi", serif',
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }}
    >
      {/* 成就获得标题 */}
      <div className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-60 transition-all duration-700 ${
        showContent && !isClosing ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-300 mb-2" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.8)' }}>
            🏆 成就获得 🏆
          </div>
          <div className="text-lg text-yellow-200" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            {audioRecord.nftMinted ? "✨ 珍藏版记忆唱片 ✨" : "🌸 开花记忆抽取 🌸"}
          </div>
        </div>
      </div>

      {/* 动画唱片 - 从屏幕中心上方出现 */}
      <img 
        src={audioRecord.nftMinted ? "/CDVIP.png" : "/CD.png"}
        className={`fixed z-60 transition-all duration-700 ease-out ${
          showContent && !isClosing ? 'animate-spin-slow' : ''
        }`}
        style={{
          left: 'calc(50vw - 140px)',
          top: isClosing ? 'calc(15vh - 140px)' : showContent ? 'calc(25vh - 140px)' : 'calc(15vh - 140px)',
          width: isClosing ? '100px' : showContent ? '280px' : '100px',
          height: isClosing ? '100px' : showContent ? '280px' : '100px',
          opacity: isClosing ? 0 : showContent ? 1 : 0,
          aspectRatio: '1/1', // 确保保持圆形
          filter: `
            drop-shadow(0 12px 24px rgba(139, 69, 19, 0.6))
            drop-shadow(0 6px 12px rgba(160, 82, 45, 0.4))
            drop-shadow(0 0 30px rgba(218, 165, 32, 0.3))
          `
        }}
      />
      
      {/* 内容区域 - 动画完成后显示 */}
      {showContent && !isClosing && (
        <div className="flex flex-col items-center justify-center h-full">
          {/* 成就信息卡片 */}
          <div 
            className="mt-80 bg-gradient-to-br from-yellow-900/80 to-amber-900/80 backdrop-blur-sm rounded-2xl p-8 max-w-lg mx-4 border-2 border-yellow-500/50 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            {/* 核心事件 */}
            <div className="text-center mb-6">
              <div className="text-yellow-200 text-lg font-bold mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                🎯 核心事件
              </div>
              <div className="text-yellow-100 text-xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {audioRecord.coreEvent}
              </div>
            </div>
            
            {/* 情感标签 */}
            <div className="mb-6">
              <div className="text-yellow-200 text-lg font-bold mb-3 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                🏷️ 情感标签
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {audioRecord.emotionTags?.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 text-sm font-bold rounded-full"
                    style={{
                      background: 'linear-gradient(45deg, #DAA520, #FFD700)',
                      color: '#8B4513',
                      textShadow: '1px 1px 2px rgba(255,255,255,0.3)',
                      border: '2px solid #B8860B',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    {tag}
                  </span>
                )) || (
                  <span className="text-yellow-400 text-base">暂无标签</span>
                )}
              </div>
            </div>

            {/* 获得时间 */}
            <div className="text-center">
              <div className="text-yellow-200 text-lg font-bold mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                📅 获得时间
              </div>
              <div className="text-yellow-100 text-base" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {new Date(audioRecord.wateringTime).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
          
          {/* 关闭提示 */}
          <div className="text-yellow-400 text-sm mt-8 animate-pulse" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            点击任意位置关闭
          </div>
        </div>
      )}
    </div>
  );
});
