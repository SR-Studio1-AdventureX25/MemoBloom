import { memo, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Plant } from "@/types";

// 植物完成成就弹窗组件 - 游戏成就风格
export const PlantCompletionModal = memo(function ({
  plant, 
  isOpen, 
  onClose
}: {
  plant: Plant | null, 
  isOpen: boolean, 
  onClose: () => void
}) {
  const navigate = useNavigate();
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
      
      // 延迟显示内容，等待标本动画完成
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

  // 计算养成天数
  const getDaysGrown = (plant: Plant): number => {
    if (!plant.createdAt) return 0;
    const createdDate = new Date(plant.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 始终渲染，通过CSS控制显示状态
  if (!plant) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-500 ${
        modalVisible && !isClosing ? 'opacity-100' : 'opacity-0'
      } ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
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
            ✨ 植物养成完成 ✨
          </div>
        </div>
      </div>

      {/* 植物标本图标 - 从屏幕中心上方出现 */}
      <img 
        src="/specimen1.png"
        className={`fixed z-60 transition-all duration-700 ease-out ${
          showContent && !isClosing ? 'animate-bounce-gentle animate-bloom-glow' : ''
        }`}
        style={{
          left: 'calc(50vw - 140px)',
          top: isClosing ? 'calc(15vh - 140px)' : showContent ? 'calc(25vh - 140px)' : 'calc(15vh - 140px)',
          width: isClosing ? '100px' : showContent ? '280px' : '100px',
          height: isClosing ? '100px' : showContent ? '280px' : '100px',
          opacity: isClosing ? 0 : showContent ? 1 : 0,
          aspectRatio: '1/1', // 确保保持比例
          filter: `
            drop-shadow(0 12px 24px rgba(34, 139, 34, 0.6))
            drop-shadow(0 6px 12px rgba(50, 205, 50, 0.4))
            drop-shadow(0 0 30px rgba(144, 238, 144, 0.3))
          `
        }}
      />
      
      {/* 内容区域 - 动画完成后显示 */}
      {showContent && !isClosing && (
        <div className="flex flex-col items-center justify-center h-full">
          {/* 成就信息卡片 */}
          <div 
            className="mt-80 bg-gradient-to-br from-green-900/80 to-emerald-900/80 backdrop-blur-sm rounded-2xl p-8 max-w-lg mx-4 border-2 border-green-500/50 shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            {/* 植物品种 */}
            <div className="text-center mb-6">
              <div className="text-green-200 text-lg font-bold mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                🌱 植物品种
              </div>
              <div className="text-green-100 text-xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {plant.variety}
              </div>
            </div>
            
            {/* 养成时间 */}
            <div className="text-center mb-6">
              <div className="text-green-200 text-lg font-bold mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                ⏰ 养成时间
              </div>
              <div className="text-green-100 text-xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {getDaysGrown(plant)} 天
              </div>
            </div>
            
            {/* 个性标签 */}
            <div className="mb-6">
              <div className="text-green-200 text-lg font-bold mb-3 text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                🏷️ 个性标签
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {plant.personalityTags?.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 text-sm font-bold rounded-full"
                    style={{
                      background: 'linear-gradient(45deg, #228B22, #32CD32)',
                      color: '#FFFFFF',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      border: '2px solid #90EE90',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                  >
                    {tag}
                  </span>
                )) || (
                  <span className="text-green-400 text-base">暂无标签</span>
                )}
              </div>
            </div>

            {/* 收藏提示 */}
            <div className="text-center mb-8">
              <div className="text-green-200 text-lg font-bold mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                📚 收藏状态
              </div>
              <div className="text-green-100 text-base" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                已自动加入收藏夹
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                🌱 继续养护这株植物
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                  // 延迟跳转，等待弹窗关闭动画完成
                  setTimeout(() => {
                    navigate('/createplant');
                  }, 700);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
              >
                ✨ 创建新的植物
              </button>
            </div>
          </div>
          
          {/* 提示文字 */}
          <div className="text-green-400 text-sm mt-6 text-center animate-pulse" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            选择你的下一步行动
          </div>
        </div>
      )}
    </div>
  );
});
