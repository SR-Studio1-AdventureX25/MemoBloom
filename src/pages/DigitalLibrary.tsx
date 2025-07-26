import { memo, useEffect, useRef, useState } from "react";
import type { Plant, WateringRecord } from "@/types";
import { useAppStore } from "@/store";

// 7段数码管组件
const SevenSegmentDigit = memo(function ({ digit }: { digit: number }) {
  // 7段数码管的段定义 (a, b, c, d, e, f, g)
  const segments = {
    0: [true, true, true, true, true, true, false],
    1: [false, true, true, false, false, false, false],
    2: [true, true, false, true, true, false, true],
    3: [true, true, true, true, false, false, true],
    4: [false, true, true, false, false, true, true],
    5: [true, false, true, true, false, true, true],
    6: [true, false, true, true, true, true, true],
    7: [true, true, true, false, false, false, false],
    8: [true, true, true, true, true, true, true],
    9: [true, true, true, true, false, true, true],
  };

  const segmentPattern = segments[digit as keyof typeof segments] || [false, false, false, false, false, false, false];

  const segmentStyle = (isActive: boolean) => ({
    background: isActive ? 'linear-gradient(145deg, #4a4a4a, #2a2a2a)' : 'transparent',
    boxShadow: isActive ? `
      0 4px 8px rgba(0, 0, 0, 0.4),
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 2px 2px 4px rgba(255, 255, 255, 0.1),
      inset -2px -2px 4px rgba(0, 0, 0, 0.4),
      0 0 12px rgba(74, 74, 74, 0.6)
    ` : 'none',
    border: isActive ? '1px solid #333333' : 'none',
    transition: 'all 0.2s ease',
    display: isActive ? 'block' : 'none'
  });

  return (
    <div className="relative w-12 h-18 mx-1">
      {/* 段 a (顶部) */}
      <div 
        className="absolute top-0 left-1 w-9 h-1.5"
        style={{
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          ...segmentStyle(segmentPattern[0])
        }}
      />
      
      {/* 段 b (右上) */}
      <div 
        className="absolute top-1 right-0 w-1.5 h-7"
        style={{
          clipPath: 'polygon(0% 10%, 100% 0%, 100% 90%, 0% 100%)',
          ...segmentStyle(segmentPattern[1])
        }}
      />
      
      {/* 段 c (右下) */}
      <div 
        className="absolute bottom-1 right-0 w-1.5 h-7"
        style={{
          clipPath: 'polygon(0% 0%, 100% 10%, 100% 90%, 0% 100%)',
          ...segmentStyle(segmentPattern[2])
        }}
      />
      
      {/* 段 d (底部) */}
      <div 
        className="absolute bottom-0 left-1 w-9 h-1.5"
        style={{
          clipPath: 'polygon(0% 0%, 100% 0%, 90% 100%, 10% 100%)',
          ...segmentStyle(segmentPattern[3])
        }}
      />
      
      {/* 段 e (左下) */}
      <div 
        className="absolute bottom-1 left-0 w-1.5 h-7"
        style={{
          clipPath: 'polygon(0% 10%, 100% 0%, 100% 100%, 0% 90%)',
          ...segmentStyle(segmentPattern[4])
        }}
      />
      
      {/* 段 f (左上) */}
      <div 
        className="absolute top-1 left-0 w-1.5 h-7"
        style={{
          clipPath: 'polygon(0% 0%, 100% 10%, 100% 100%, 0% 90%)',
          ...segmentStyle(segmentPattern[5])
        }}
      />
      
      {/* 段 g (中间) */}
      <div 
        className="absolute top-8 left-1 w-9 h-1.5"
        style={{
          clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)',
          ...segmentStyle(segmentPattern[6])
        }}
      />
    </div>
  );
});

// 数码管风格的时间显示组件
const DigitalCalendar = memo(function ({ scrollLeft = 0 }: { scrollLeft?: number }) {
  // 根据滚动位置和时间首位估计时间
  const getEstimatedTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // 根据滚动位置调整时间（简单的估算逻辑）
    const scrollFactor = Math.floor(scrollLeft / 100); // 每100px滚动调整1个单位
    const estimatedMonth = Math.max(1, Math.min(12, month + scrollFactor));
    
    return { year, month: estimatedMonth };
  };

  const { year, month } = getEstimatedTime();

  return (
    <div className="flex items-center justify-center p-4">
      {/* 一行显示年份和月份，中间用空格隔开 */}
      <div className="flex items-center gap-6">
        {/* 年份 */}
        <div className="flex items-center gap-1">
          <SevenSegmentDigit digit={Math.floor(year / 1000)} />
          <SevenSegmentDigit digit={Math.floor((year % 1000) / 100)} />
          <SevenSegmentDigit digit={Math.floor((year % 100) / 10)} />
          <SevenSegmentDigit digit={year % 10} />
        </div>
        
        {/* 月份 */}
        <div className="flex items-center gap-1">
          <SevenSegmentDigit digit={Math.floor(month / 10)} />
          <SevenSegmentDigit digit={month % 10} />
        </div>
      </div>
    </div>
  );
});

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

const EmptyBox = memo(function ({offset}: {offset: {x: number, y: number}}) {
  return (
    <div 
      className="w-32 h-32 bg-cover bg-center bg-no-repeat transition-transform duration-300"
      style={{
        backgroundImage: `url("/box.png")`,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        filter: `
          drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))
          drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))
          drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))
        `,
        opacity: 0.7
      }}
    >
      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
        空
      </div>
    </div>
  );
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
  // 从 store 获取收藏数据
  const { favoritePlants, favoriteWateringRecords } = useAppStore();
  
  // 音频详情模态框状态
  const [selectedAudio, setSelectedAudio] = useState<WateringRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [animationData, setAnimationData] = useState<{
    startX: number,
    startY: number,
    startSize: number
  } | null>(null);
  
  // 滚动位置状态
  const [scrollLeft, setScrollLeft] = useState(0);

  // 处理音频点击
  const handleAudioClick = (audioRecord: WateringRecord, event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // 找到对应的offset - 通过查找匹配的audioRecord
    let offset = { x: 0, y: 0 };
    const audioIndex = sortedAudios.findIndex(audio => audio.id === audioRecord.id);
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

  // 使用收藏数据替代假数据，按时间顺序排序
  const sortedPlants = favoritePlants.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const sortedAudios = favoriteWateringRecords.sort((a, b) => new Date(a.wateringTime).getTime() - new Date(b.wateringTime).getTime());

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // 页面加载时向右滚动 90px
      scrollAreaRef.current.scrollLeft = 90;
      setScrollLeft(90);
    }
  }, []);

  // 处理滚动事件
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollLeft(target.scrollLeft);
  };

  return (
    <div 
      className="w-full h-screen relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("/library.png")` }}
    >
      {/* 横向滚动容器 */}
      <div 
        ref={scrollAreaRef}
        data-horizontal-scroll
        className="w-full overflow-x-auto overflow-y-hidden scrollbar-hidden px-12 py-8"
        onScroll={handleScroll}
      >
        {/* 内容容器 - 足够宽以容纳所有卡片 */}
        <div className="flex flex-col gap-16">
          {/* 第一行 - 确保至少显示2个空box */}
          <div className="flex gap-8">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`row1-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
                {i % 2 === 0 && sortedPlants.length > 0 ? (
                  // 奇数位（索引0,2,4...）放PlantBox，如果有收藏植物的话
                  <PlantBox 
                    plant={sortedPlants[Math.floor(i/2) % sortedPlants.length]} 
                    offset={boxOffsets[`row1-${i}`] || {x: 0, y: 0}}
                  />
                ) : i < 4 ? (
                  // 前4个位置（索引0,1,2,3）如果没有内容则显示空box，确保至少有2个空box
                  <EmptyBox offset={boxOffsets[`row1-${i}`] || {x: 0, y: 0}} />
                ) : (
                  // 其他位置留空
                  <div className="w-32 h-32"></div>
                )}
              </div>
            ))}
          </div>

          {/* 第二行 - 确保至少显示1个空box */}
          <div className="flex gap-8">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={`row2-${i}`} className="w-32 h-32 flex-shrink-0 p-6">
                {i % 2 === 1 && sortedAudios.length > 0 ? (
                  // 偶数位（索引1,3,5...）放AudioBox，如果有收藏浇水记录的话
                  <AudioBox 
                    audioRecord={sortedAudios[Math.floor(i/2) % sortedAudios.length]} 
                    offset={boxOffsets[`row2-${i}`] || {x: 0, y: 0}}
                    onClick={(event) => handleAudioClick(sortedAudios[Math.floor(i/2) % sortedAudios.length], event)}
                  />
                ) : i < 2 ? (
                  // 前2个位置（索引0,1）如果没有内容则显示空box，确保至少有1个空box
                  <EmptyBox offset={boxOffsets[`row2-${i}`] || {x: 0, y: 0}} />
                ) : (
                  // 其他位置留空
                  <div className="w-32 h-32"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="calendar mt-12 flex justify-center scale-70">
        <DigitalCalendar scrollLeft={scrollLeft} />
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
