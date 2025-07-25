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

const AudioBox = memo(function ({offset}: {audioRecord: WateringRecord, offset: {x: number, y: number}}){
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
        <img src="/CD.png" className="scale-85" />
    </div>
  </>);
});


export default function DigitalLibraryPage() {

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
      memoryText: "今天心情很好，和朋友聊天很开心",
      emotionTags: ["开心", "满足"],
      emotionIntensity: 8,
      growthIncrement: 5,
      coreEvent: "与朋友聚会",
      nftMinted: true,
      wateringTime: "2024-01-15T10:30:00Z"
    },
    {
      id: "audio-2",
      plantId: "plant-2", 
      plantGrowthValue: 65,
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
    </div>
  )
}
