import { memo, useEffect, useState } from "react";
import type { Plant } from "@/types";

// 基于植物ID的哈希算法，确保分配规则固定不变
const getSpecimenImage = (plantId: string): string => {
  const hash = plantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const imageIndex = (hash % 3) + 1; // 1, 2, 3
  return `/specimen${imageIndex}.png`;
};

// 全屏植物详情组件
export const PlantDetailModal = memo(function ({
  plant, 
  isOpen, 
  onClose, 
  animationData
}: {
  plant: Plant | null, 
  isOpen: boolean, 
  onClose: () => void,
  animationData: {
    startX: number,
    startY: number,
    startSize: number
  } | null
}) {
  const [showContent, setShowContent] = useState(false);
  const [animatingSpecimen, setAnimatingSpecimen] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen && animationData) {
      // 动画开始时隐藏内容
      setShowContent(false);
      setAnimatingSpecimen(true);
      setIsClosing(false);
      
      // 立即显示模态框，开始淡入
      setModalVisible(true);
      
      // 延迟显示内容，等待标本动画完成
      const timer = setTimeout(() => {
        setShowContent(true);
        setAnimatingSpecimen(false);
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
    setAnimatingSpecimen(true); // 开始反向动画
    
    // 等待标本回到原位置后关闭模态框
    setTimeout(() => {
      onClose();
    }, 1000); // 延长等待时间，确保动画完成
  };

  // 始终渲染，通过CSS控制显示状态
  if (!plant || !animationData) return null;

  const specimenImage = getSpecimenImage(plant.id);

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
      {/* 动画标本 */}
      <div
        className={`fixed z-60 transition-all duration-700 ease-out cursor-pointer group`}
        style={{
          left: (animatingSpecimen && !isClosing) || isClosing ? `${animationData.startX}px` : `calc(50vw - 140px)`,
          top: (animatingSpecimen && !isClosing) || isClosing ? `${animationData.startY}px` : `calc(22vh - 140px)`,
          width: (animatingSpecimen && !isClosing) || isClosing ? `${animationData.startSize}px` : '280px',
          height: (animatingSpecimen && !isClosing) || isClosing ? `${animationData.startSize}px` : '280px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={specimenImage}
          className="w-full h-full object-cover rounded-lg transition-all duration-200 group-hover:scale-105"
          style={{
            filter: `
              drop-shadow(0 12px 24px rgba(34, 139, 34, 0.6))
              drop-shadow(0 6px 12px rgba(46, 125, 50, 0.4))
              drop-shadow(0 0 30px rgba(76, 175, 80, 0.3))
              ${showContent && !isClosing ? 'brightness(1.1)' : ''}
            `
          }}
        />
      </div>
      
      {/* 内容区域 - 动画完成后显示 */}
      {showContent && !isClosing && (
        <div className="flex flex-col items-center justify-center h-full">
          {/* 标题 */}
          <h3 
            className="text-3xl font-bold mb-8 text-green-200 animate-fade-in" 
            style={{ 
              textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
              marginTop: '320px' // 进一步下移标题位置
            }}
          >
            {plant.nftMinted ? "✨ 珍藏版植物标本 ✨" : "🌿 植物标本 🌿"}
          </h3>
          
          {/* 信息直接显示在遮罩层上 */}
          <div className="text-center space-y-4 max-w-2xl px-8 animate-fade-in-up">
            {/* 植物品种 */}
            <div className="text-green-200 text-xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              品种：{plant.variety}
            </div>
            
            {/* 生长阶段 */}
            <div className="text-green-100 text-lg" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              生长阶段：{plant.currentGrowthStage === 'seed' ? '种子' : 
                        plant.currentGrowthStage === 'sprout' ? '发芽' :
                        plant.currentGrowthStage === 'mature' ? '含苞' :
                        plant.currentGrowthStage === 'flowering' ? '开花' :
                        plant.currentGrowthStage === 'fruiting' ? '结束' : plant.currentGrowthStage}
            </div>
            
            {/* 个性标签 */}
            <div className="flex flex-wrap gap-3 justify-center">
              {plant.personalityTags?.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-4 py-2 text-sm font-bold rounded-full"
                  style={{
                    background: 'linear-gradient(45deg, #4CAF50, #8BC34A)',
                    color: '#1B5E20',
                    textShadow: '1px 1px 2px rgba(255,255,255,0.3)',
                    border: '2px solid #388E3C',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {tag}
                </span>
              )) || <span className="text-green-400 text-lg">暂无标签</span>}
            </div>
            
            {/* 数值信息 */}
            <div className="flex justify-center gap-8 text-green-200 text-lg font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              <span>成长值：{plant.growthValue}</span>
              <span>用户状况：{plant.userRecentStatus}</span>
            </div>

            {/* 时间信息 */}
            <div className="text-green-300 text-base" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              创建时间：{new Date(plant.createdAt).toLocaleString('zh-CN')}
            </div>
            
            {plant.lastWateringTime && (
              <div className="text-green-300 text-base" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                上次浇水：{new Date(plant.lastWateringTime).toLocaleString('zh-CN')}
              </div>
            )}
            
            {/* NFT信息 */}
            {plant.nftMinted && (
              <div className="text-purple-200 text-sm space-y-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                <div>
                  <span className="font-bold text-purple-300">🔗 区块链地址：</span>
                  <div className="font-mono text-xs break-all mt-1 text-purple-100">
                    {plant.nftAddress}
                  </div>
                </div>
                {plant.nftWalletAddress && (
                  <div>
                    <span className="font-bold text-purple-300">👛 钱包地址：</span>
                    <div className="font-mono text-xs break-all mt-1 text-purple-100">
                      {plant.nftWalletAddress}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 关闭提示 */}
            <div className="text-green-400 text-sm mt-8" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              点击任意位置关闭
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
