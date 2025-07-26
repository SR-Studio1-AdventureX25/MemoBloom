import { memo, useEffect, useState } from "react";
import type { WateringRecord } from "@/types";

// 全屏音频详情组件
export const AudioDetailModal = memo(function ({
  audioRecord, 
  isOpen, 
  onClose, 
  animationData
}: {
  audioRecord: WateringRecord | null, 
  isOpen: boolean, 
  onClose: () => void,
  animationData: {
    startX: number,
    startY: number,
    startSize: number
  } | null
}) {
  const [showContent, setShowContent] = useState(false);
  const [animatingDisc, setAnimatingDisc] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen && animationData) {
      // 动画开始时隐藏内容
      setShowContent(false);
      setAnimatingDisc(true);
      setIsClosing(false);
      
      // 立即显示模态框，开始淡入
      setModalVisible(true);
      
      // 延迟显示内容，等待唱片动画完成
      const timer = setTimeout(() => {
        setShowContent(true);
        setAnimatingDisc(false);
      }, 800); // 动画持续时间
      
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setModalVisible(false);
    }
  }, [isOpen, animationData]);

  const handleClose = () => {
    if (isClosing) return; // 防止重复点击
    
    setIsClosing(true);
    setShowContent(false); // 先隐藏内容
    setAnimatingDisc(true); // 开始反向动画
    
    // 等待唱片回到原位置后关闭模态框
    setTimeout(() => {
      onClose();
    }, 1000); // 延长等待时间，确保动画完成
  };

  // 始终渲染，通过CSS控制显示状态
  if (!audioRecord || !animationData) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${
        modalVisible && !isClosing ? 'opacity-100' : 'opacity-0'
      } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onClick={handleClose}
      style={{ 
        fontFamily: '"DingTalk JinBuTi", serif',
        backgroundColor: 'rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* 动画唱片 */}
      <img 
        src={audioRecord.nftMinted ? "/CDVIP.png" : "/CD.png"}
        className={`fixed z-60 transition-all duration-700 ease-out ${!animatingDisc && !isClosing ? 'animate-spin-slow' : ''}`}
        style={{
          left: (animatingDisc && !isClosing) || isClosing ? `${animationData.startX}px` : `calc(50vw - 140px)`,
          top: (animatingDisc && !isClosing) || isClosing ? `${animationData.startY}px` : `calc(22vh - 140px)`,
          width: (animatingDisc && !isClosing) || isClosing ? `${animationData.startSize}px` : '280px',
          height: (animatingDisc && !isClosing) || isClosing ? `${animationData.startSize}px` : '280px',
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
          {/* 标题 */}
          <h3 
            className="text-3xl font-bold mb-8 text-yellow-200 animate-fade-in" 
            style={{ 
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              marginTop: '320px' // 进一步下移标题位置
            }}
          >
            {audioRecord.nftMinted ? "✨ 珍藏版记忆唱片 ✨" : "🎵 记忆唱片 🎵"}
          </h3>
          
          {/* 信息直接显示在遮罩层上 */}
          <div className="text-center space-y-4 max-w-2xl px-8 animate-fade-in-up">
            {/* 核心事件 */}
            <div className="text-yellow-200 text-xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              核心事件：{audioRecord.coreEvent}
            </div>
            
            {/* 记忆内容 */}
            <div className="text-yellow-100 text-lg italic" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              "{audioRecord.memoryText}"
            </div>
            
            {/* 情感标签 */}
            <div className="flex flex-wrap gap-3 justify-center">
              {audioRecord.emotionTags?.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-4 py-2 text-sm font-bold rounded-full"
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
              )) || <span className="text-yellow-400 text-lg">暂无标签</span>}
            </div>
            
            {/* 数值信息 */}
            <div className="flex justify-center gap-8 text-yellow-200 text-lg font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              <span>情感强度：{audioRecord.emotionIntensity}/10</span>
              <span>成长值：+{audioRecord.growthIncrement}</span>
            </div>
            
            {/* 时间信息 */}
            <div className="text-yellow-300 text-base" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              收藏时间：{new Date(audioRecord.wateringTime).toLocaleString('zh-CN')}
            </div>
            
            {/* NFT信息 */}
            {audioRecord.nftMinted && (
              <div className="text-purple-200 text-sm space-y-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                <div>
                  <span className="font-bold text-purple-300">🔗 区块链地址：</span>
                  <div className="font-mono text-xs break-all mt-1 text-purple-100">
                    {audioRecord.nftAddress}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-purple-300">⏰ 铸造时间：</span>
                  <span className="ml-2">
                    {audioRecord.nftMintTime ? new Date(audioRecord.nftMintTime).toLocaleString('zh-CN') : ''}
                  </span>
                </div>
              </div>
            )}
            
            {/* 关闭提示 */}
            <div className="text-yellow-400 text-sm mt-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              点击任意位置关闭
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
