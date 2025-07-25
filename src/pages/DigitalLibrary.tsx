import { memo, useEffect, useRef, useState } from "react";
import type { Plant, WateringRecord } from "@/types";

const PlantBox = memo(function ({offset}: {plant: Plant, offset: {x: number, y: number}}) {
  return (<>
    <div 
      className="w-32 h-32 bg-cover bg-center bg-no-repeat transition-transform duration-300"
      style={{
        backgroundImage: `url("/box.png")`,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        filter: `
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
          drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))
          drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))
        `
      }}>
        植物标本
    </div>
  </>);
});

const AudioBox = memo(function ({audioRecord, offset, onClick}: {audioRecord: WateringRecord, offset: {x: number, y: number}, onClick: (event: React.MouseEvent) => void}){
  return (<>
    <div
      className="w-32 h-32 bg-cover bg-center bg-no-repeat transition-transform duration-300 cursor-pointer hover:scale-105"
      style={{
        backgroundImage: `url("/box.png")`,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        filter: `
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
          drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))
          drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))
        `
      }}
      onClick={onClick}
    >
        <img src={audioRecord.nftMinted ? "/CDVIP.png" : "/CD.png"} className="scale-85" />
    </div>
  </>);
});

// 全屏音频详情组件
const AudioDetailModal = memo(function ({
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


export default function DigitalLibraryPage() {
  // 音频详情模态框状态
  const [selectedAudio, setSelectedAudio] = useState<WateringRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animationData, setAnimationData] = useState<{
    startX: number,
    startY: number,
    startSize: number
  } | null>(null);

  // 处理音频点击
  const handleAudioClick = (audioRecord: WateringRecord, event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // 找到对应的offset - 通过查找匹配的audioRecord
    let offset = { x: 0, y: 0 };
    const audioIndex = audios.findIndex(audio => audio.id === audioRecord.id);
    if (audioIndex !== -1) {
      // 计算在第二行中的位置索引 - AudioBox在第二行的奇数位（索引1,3,5...）
      const positionInRow = Math.floor(audioIndex / 3); // 每3个audio循环一次
      const colIndex = positionInRow * 2 + 1; // 奇数列：1, 3, 5, 7, 9
      const offsetKey = `row2-${colIndex}`;
      offset = boxOffsets[offsetKey] || { x: 0, y: 0 };
    }
    
    // 更精确的位置计算
    const boxPadding = 24; // p-6 = 24px
    const discScale = 0.85;
    const boxSize = 128; // w-32 h-32 = 128px
    const discSize = boxSize * discScale; // 实际唱片大小
    
    // 找到唱片图片元素的实际位置
    const imgElement = target.querySelector('img');
    if (imgElement) {
      const imgRect = imgElement.getBoundingClientRect();
      setAnimationData({
        startX: imgRect.left,
        startY: imgRect.top,
        startSize: imgRect.width
      });
    } else {
      // 备用计算方法
      const startX = rect.left + boxPadding + offset.x + (boxSize - discSize) / 2;
      const startY = rect.top + boxPadding + offset.y + (boxSize - discSize) / 2;
      
      setAnimationData({
        startX,
        startY,
        startSize: discSize
      });
    }
    
    setSelectedAudio(audioRecord);
    setIsModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAudio(null);
    setAnimationData(null);
  };

  // 生成随机偏移的函数
  const generateRandomOffset = () => ({
    x: (Math.random() - 0.5) * 40, // -20px 到 20px 的随机水平偏移
    y: (Math.random() - 0.5) * 10  // -15px 到 15px 的随机垂直偏移
  });

  // 为每个box生成随机偏移
  const [boxOffsets] = useState(() => {
    const offsets: {[key: string]: {x: number, y: number}} = {};
    // 为第一行和第二行各10个位置生成偏移
    for (let row = 1; row <= 2; row++) {
      for (let i = 0; i < 10; i++) {
        offsets[`row${row}-${i}`] = generateRandomOffset();
      }
    }
    return offsets;
  });

  // 添加假数据
  const [plants] = useState<Plant[]>([
    {
      id: "plant-1",
      variety: "多肉植物",
      currentGrowthStage: "flowering",
      growthValue: 85,
      lastWateringTime: "2024-01-15T10:30:00Z",
      userRecentStatus: "开心",
      personalityTags: ["温和", "坚韧"],
      nftMinted: true,
      createdAt: "2024-01-01T00:00:00Z"
    },
    {
      id: "plant-2", 
      variety: "多肉植物",
      currentGrowthStage: "mature",
      growthValue: 65,
      lastWateringTime: "2024-01-14T15:20:00Z",
      userRecentStatus: "平静",
      personalityTags: ["独立", "优雅"],
      nftMinted: false,
      createdAt: "2024-01-02T00:00:00Z"
    },
    {
      id: "plant-3",
      variety: "多肉植物", 
      currentGrowthStage: "sprout",
      growthValue: 35,
      lastWateringTime: "2024-01-13T09:15:00Z",
      userRecentStatus: "兴奋",
      personalityTags: ["活泼", "好奇"],
      nftMinted: false,
      createdAt: "2024-01-03T00:00:00Z"
    }
  ]);

  const [audios] = useState<WateringRecord[]>([
    {
      id: "audio-1",
      plantId: "plant-1",
      plantGrowthValue: 85,
      memoryFile: "memory_token_abc123",
      memoryText: "今天心情很好，和朋友聊天很开心",
      emotionTags: ["开心", "满足"],
      emotionIntensity: 8,
      growthIncrement: 5,
      coreEvent: "与朋友聚会",
      nftMinted: true,
      nftAddress: "0x1234567890abcdef1234567890abcdef12345678",
      nftWalletAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
      wateringTime: "2024-01-15T10:30:00Z",
      nftMintTime: "2024-01-15T11:00:00Z"
    },
    {
      id: "audio-2",
      plantId: "plant-2", 
      plantGrowthValue: 65,
      memoryFile: "memory_token_def456",
      memoryText: "工作很忙，但是很充实",
      emotionTags: ["忙碌", "充实"],
      emotionIntensity: 6,
      growthIncrement: 3,
      coreEvent: "完成重要项目",
      nftMinted: false,
      wateringTime: "2024-01-14T15:20:00Z"
    },
    {
      id: "audio-3",
      plantId: "plant-3",
      plantGrowthValue: 35,
      memoryFile: "memory_token_ghi789",
      memoryText: "学到了新东西，很有成就感",
      emotionTags: ["兴奋", "成就感"],
      emotionIntensity: 7,
      growthIncrement: 4,
      coreEvent: "学习新技能",
      nftMinted: false,
      wateringTime: "2024-01-13T09:15:00Z"
    }
  ]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // 页面加载时向右滚动 60px
      scrollAreaRef.current.scrollLeft = 60;
    }
  }, []);


  return (
    <div 
      className="w-full h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("/library.png")` }}
    >
      {/* 横向滚动容器 */}
      <div 
        ref={scrollAreaRef}
        data-horizontal-scroll
        className="absolute top-1/4 -translate-y-1/2 left-0 w-full overflow-x-auto overflow-y-hidden scrollbar-hidden px-12 py-8"
      >
        {/* 内容容器 - 足够宽以容纳所有卡片 */}
        <div className="flex flex-col gap-16">
          {/* 第一行 - 奇数位放PlantBox，偶数位留空 */}
          <div className="flex gap-8">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`row1-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
                {i % 2 === 0 ? (
                  // 奇数位（索引0,2,4...）放PlantBox
                  <PlantBox 
                    plant={plants[i % plants.length]} 
                    offset={boxOffsets[`row1-${i}`] || {x: 0, y: 0}}
                  />
                ) : (
                  // 偶数位留空
                  <div className="w-32 h-32"></div>
                )}
              </div>
            ))}
          </div>

          {/* 第二行 - 偶数位放AudioBox，奇数位留空 */}
          <div className="flex gap-8">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`row2-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
                {i % 2 === 1 ? (
                  // 偶数位（索引1,3,5...）放AudioBox
                  <AudioBox 
                    audioRecord={audios[i % audios.length]} 
                    offset={boxOffsets[`row2-${i}`] || {x: 0, y: 0}}
                    onClick={(event) => handleAudioClick(audios[i % audios.length], event)}
                  />
                ) : (
                  // 奇数位留空
                  <div className="w-32 h-32"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 音频详情模态框 */}
      <AudioDetailModal 
        audioRecord={selectedAudio}
        isOpen={isModalOpen}
        onClose={closeModal}
        animationData={animationData}
      />
    </div>
  )
}
